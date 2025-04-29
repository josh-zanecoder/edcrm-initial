import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { cookies } from 'next/headers';

const { TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_APP_SID } = process.env;

export async function GET() {
  try {
    console.log('Twilio token generation requested');
    
    // Get user from cookie
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie?.value) {
      console.error('No user cookie found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userCookie.value);
    const identity = user.email; // Use user's email as identity
    console.log('Generating token for user:', identity);

    // Check if Twilio credentials are available
    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET || !TWILIO_APP_SID) {
      console.error('Missing Twilio credentials:', {
        hasAccountSid: !!TWILIO_ACCOUNT_SID,
        hasApiKey: !!TWILIO_API_KEY,
        hasApiSecret: !!TWILIO_API_SECRET,
        hasAppSid: !!TWILIO_APP_SID
      });
      return NextResponse.json(
        { error: 'Twilio configuration error' },
        { status: 500 }
      );
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: TWILIO_APP_SID!,
      incomingAllow: true,
    });

    const token = new AccessToken(
      TWILIO_ACCOUNT_SID!,
      TWILIO_API_KEY!,
      TWILIO_API_SECRET!,
      { identity }
    );

    token.addGrant(voiceGrant);
    const jwtToken = token.toJwt();
    console.log('Twilio token generated successfully');

    return NextResponse.json({ token: jwtToken });
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
} 