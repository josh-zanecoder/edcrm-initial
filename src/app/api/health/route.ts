import { NextResponse } from 'next/server';
import { getApps } from 'firebase-admin/app';
import '@/lib/firebase-admin';

export async function GET() {
  try {
    // Check Firebase connection
    const firebaseApps = getApps();
    if (firebaseApps.length === 0) {
      throw new Error('Firebase Admin not initialized');
    }

    // Simplified health check response
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      services: {
        firebase: 'connected'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      services: {
        firebase: error instanceof Error && error.message.includes('Firebase') ? 'disconnected' : 'connected'
      }
    }, { status: 503 });
  }
} 