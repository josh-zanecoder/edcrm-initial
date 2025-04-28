import { User } from 'firebase/auth';
import { adminAuth } from './firebase-admin';

export const authOptions = {
  verifyToken: async (token: string) => {
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      return decodedToken;
    } catch{
      throw new Error('Invalid token');
    }
  },
  
  verifyUser: async (token: string, user: User) => {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.uid !== user.uid) {
      throw new Error('Token does not match user');
    }
    return decodedToken;
  }
}; 