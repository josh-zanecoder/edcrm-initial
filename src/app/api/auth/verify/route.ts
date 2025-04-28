import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { token, user } = await request.json();

    if (!token || !user) {
      return NextResponse.json(
        { error: 'Token and user data are required' },
        { status: 400 }
      );
    }

    try {
      // Verify the ID token with Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Check if the token belongs to the user
      if (decodedToken.uid !== user.uid) {
        return NextResponse.json(
          { error: 'Token does not match user' },
          { status: 401 }
        );
      }

      // Check token expiration
      if (decodedToken.exp * 1000 < Date.now()) {
        return NextResponse.json(
          { error: 'Token has expired' },
          { status: 401 }
        );
      }

      // Get MongoDB client
      const client = await clientPromise;
      const db = client.db();

      // Check if user exists in salespersons collection
      const salesperson = await db.collection('salespersons').findOne({ 
        firebase_uid: decodedToken.uid 
      });

      const userData = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: user.displayName || decodedToken.email?.split('@')[0],
        token: token,
        role: salesperson ? 'salesperson' : 'admin',
        redirectTo: salesperson ? '/salesperson' : '/admin'
      };

      return NextResponse.json({
        valid: true,
        user: userData
      });
    } catch (error: unknown) {
      console.error('Token verification error:', error);
      
      if (error instanceof Error && 'code' in error && error.code === 'auth/id-token-expired') {
        return NextResponse.json(
          { error: 'Token has expired' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
} 