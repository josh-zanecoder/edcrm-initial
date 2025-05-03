import { NextResponse } from 'next/server';
import { CreateSalespersonInput } from '@/types/salesperson';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase';
import { unformatPhoneNumber } from '@/utils/formatters';
import { sendCredentialEmail } from '@/lib/sendCredentialEmail';
import { SalesPersonModel } from '@/models/SalesPerson';
import { UserModel } from '@/models/User';
import connectToMongoDB from '@/lib/mongoose';
  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export async function POST(request: Request) {
  let session;
  let firebaseUser;
  
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone, password, twilio_number } = body as CreateSalespersonInput & { password: string };

    if (!first_name || !last_name || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    await connectToMongoDB();

    // Check if email already exists using Mongoose models
    const [existingUser, existingSalesperson] = await Promise.all([
      UserModel.findOne({ email }).exec(),
      SalesPersonModel.findOne({ email }).exec()
    ]);

    if (existingUser || existingSalesperson) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Create Firebase user
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

    // Start mongoose transaction
    session = await SalesPersonModel.startSession();
    session.startTransaction();

    try {
      // Create user and salesperson using Mongoose models
      const newUser = new UserModel({
        firebase_uid: firebaseUser.uid,
        email,
        role: 'salesperson',
        status: 'active'
      });

      const newSalesperson = new SalesPersonModel({
        first_name,
        last_name,
        email,
        phone: unformatPhoneNumber(phone),
        twilio_number: twilio_number ? unformatPhoneNumber(twilio_number) : null,
        firebase_uid: firebaseUser.uid,
        status: 'active',
        role: 'salesperson',
        joinDate: new Date().toISOString()
      });

      // Save both documents in the transaction
      await Promise.all([
        newUser.save({ session }),
        newSalesperson.save({ session })
      ]);

      // Try to send welcome email before committing
      try {
        await sendCredentialEmail(email, `${first_name} ${last_name}`, password);
      } catch (emailError) {
        // If email fails, throw error to trigger rollback
        throw new Error('Failed to send welcome email: ' + (emailError instanceof Error ? emailError.message : 'Unknown error'));
      }

      // Only commit if everything succeeded including email
      await session.commitTransaction();

      return NextResponse.json(
        {
          message: 'Salesperson created successfully',
          user: { ...newUser.toObject(), id: newUser.firebase_uid },
          salesperson: { ...newSalesperson.toObject(), id: newSalesperson.firebase_uid }
        },
        { status: 201 }
      );
    } catch (error) {
      // Rollback transaction and cleanup Firebase user
      await session.abortTransaction();
      try {
        if (firebaseUser) {
          await firebaseUser.delete();
        }
      } catch (deleteError) {
        console.error('Failed to cleanup Firebase user after error:', deleteError);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating salesperson:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create salesperson',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
