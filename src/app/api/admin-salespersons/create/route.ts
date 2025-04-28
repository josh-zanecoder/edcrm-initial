import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { CreateSalespersonInput } from '@/types/salesperson';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import {firebaseConfig} from '@/lib/firebase';
// Initialize Firebase


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone, password } = body as CreateSalespersonInput & { password: string };

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

    // Check if email already exists in MongoDB
    const existingSalesperson = await db
      .collection('salespersons')
      .findOne({ email });

    if (existingSalesperson) {
      return NextResponse.json(
        { error: 'A salesperson with this email already exists' },
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

    // Create new salesperson in MongoDB
    const newSalesperson = {
      first_name,
      last_name,
      email,
      phone,
      firebase_uid: firebaseUser.uid,
      status: 'active',
      role: 'salesperson',
      joinDate: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // First, create the salesperson record
    const result = await db.collection('salespersons').insertOne(newSalesperson);

    // Then, create a separate user roles record
    await db.collection('user_roles').insertOne({
      user_id: firebaseUser.uid,
      email: email,
      role: 'salesperson',
      created_at: new Date(),
      updated_at: new Date()
    });

    return NextResponse.json(
      { 
        message: 'Salesperson created successfully',
        salesperson: {
          id: result.insertedId.toString(),
          ...newSalesperson
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