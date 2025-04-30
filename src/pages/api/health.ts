import { NextApiRequest, NextApiResponse } from 'next';
import { getApps } from 'firebase-admin/app';
import '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check Firebase connection
    const firebaseApps = getApps();
    if (firebaseApps.length === 0) {
      throw new Error('Firebase Admin not initialized');
    }

    // Simplified health check response
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      services: {
        firebase: 'connected'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      services: {
        firebase: error instanceof Error && error.message.includes('Firebase') ? 'disconnected' : 'connected'
      }
    });
  }
}
