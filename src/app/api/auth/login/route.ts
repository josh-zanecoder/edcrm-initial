import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required', code: 'missing-credentials' },
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

      // Check if user exists in users collection
      const userRecord = await db.collection('users').findOne({ 
        firebase_uid: user.uid 
      });

      // If user doesn't exist in MongoDB, deny access
      if (!userRecord) {
        return NextResponse.json(
          { error: 'User not authorized. Please contact administrator.', code: 'unauthorized' },
          { status: 403 }
        );
      }

      // Get additional user data from salespersons collection if needed
      const salesperson = userRecord.role === 'salesperson' 
        ? await db.collection('salespersons').findOne({ firebase_uid: user.uid })
        : null;

      // Create a session with the user data
      const session = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split('@')[0],
        token: token,
        role: userRecord.role,
        firstName: salesperson?.first_name,
        lastName: salesperson?.last_name,
        redirectTo: userRecord.role === 'admin' ? '/admin' : '/salesperson'
      };

      return NextResponse.json({
        user: session,
        message: 'Login successful'
      });
    } catch (firebaseError: any) {
      return NextResponse.json(
        { 
          error: firebaseError.message || 'Authentication failed',
          code: firebaseError.code || 'auth/unknown-error'
        },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Invalid request format', code: 'invalid-request' },
      { status: 400 }
    );
  }
}
