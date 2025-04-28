import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();

      // Get MongoDB client
      const client = await clientPromise;
      const db = client.db();

      // Check if user exists in salespersons collection
      const salesperson = await db.collection('salespersons').findOne({ 
        firebase_uid: user.uid 
      });

      // Create a session with the user data
      const session = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split('@')[0],
        token: token,
        role: salesperson ? 'salesperson' : 'admin',
        redirectTo: salesperson ? '/salesperson' : '/admin'
      };

      return NextResponse.json({
        user: session,
        message: 'Login successful'
      });
    } catch (firebaseError: unknown) {
      console.error('Firebase authentication error:', firebaseError);
      return NextResponse.json(
        { error: (firebaseError as Error).message || 'Authentication failed' },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
}
