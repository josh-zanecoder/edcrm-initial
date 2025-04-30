import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { CreateSalespersonInput } from '@/types/salesperson';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import {firebaseConfig} from '@/lib/firebase';
import { unformatPhoneNumber } from '@/utils/formatters';



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone, password, twilio_number } = body as CreateSalespersonInput & { password: string };

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if email already exists in either collection
    const [existingUser, existingSalesperson] = await Promise.all([
      db.collection('users').findOne({ email }),
      db.collection('salespersons').findOne({ email })
    ]);

    if (existingUser || existingSalesperson) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Create Firebase user
    let firebaseUser;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
    } catch (error: unknown) {
      console.error('Firebase user creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create user account: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 400 }
      );
    }

    // Create user record
    const newUser = {
      firebase_uid: firebaseUser.uid,
      email,
      role: 'salesperson',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create salesperson record with unformatted phone numbers
    const newSalesperson = {
      first_name,
      last_name,
      email,
      phone: unformatPhoneNumber(phone),
      twilio_number: twilio_number ? unformatPhoneNumber(twilio_number) : null,
      firebase_uid: firebaseUser.uid,
      status: 'active',
      role: 'salesperson',
      joinDate: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create both records in a transaction
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection('users').insertOne(newUser);
        await db.collection('salespersons').insertOne(newSalesperson);
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(
      { 
        message: 'Salesperson created successfully',
        user: {
          ...newUser,
          id: newUser.firebase_uid
        },
        salesperson: {
          ...newSalesperson,
          id: newSalesperson.firebase_uid
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating salesperson:', error);
    return NextResponse.json(
      { error: 'Failed to create salesperson' },
      { status: 500 }
    );
  }
}