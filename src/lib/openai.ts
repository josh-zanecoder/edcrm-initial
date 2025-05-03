import OpenAI from 'openai';
import axios from 'axios';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    // Download the audio file from Twilio with authentication
    const response = await axios.get(audioUrl, {
      auth: {
        username: TWILIO_ACCOUNT_SID || '',
        password: TWILIO_AUTH_TOKEN || ''
      },
      responseType: 'arraybuffer'
    });

    // Create a file object for OpenAI
    const file = new File(
      [response.data],
      'recording.mp3',
      { type: 'audio/mp3' }
    );
    
    // Transcribe the audio using OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en'
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
} 