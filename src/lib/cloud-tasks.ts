import { GoogleAuth } from 'google-auth-library';

export async function createTranscriptionTask(recordingUrl: string, callSid: string) {
  const project = process.env.GOOGLE_CLOUD_PROJECT!;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  const queue = process.env.GOOGLE_CLOUD_QUEUE || 'transcription-queue';
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/twilio/transcribe`;

  // Initialize the auth client
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-tasks']
  });

  // Get the client
  const client = await auth.getClient();

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url,
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(JSON.stringify({ recordingUrl, callSid })).toString('base64'),
    },
  };

  const cloudTasksUrl = `https://cloudtasks.googleapis.com/v2/projects/${project}/locations/${location}/queues/${queue}/tasks`;
  
  try {
    const response = await client.request({
      url: cloudTasksUrl,
      method: 'POST',
      data: { task }
    });

    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}