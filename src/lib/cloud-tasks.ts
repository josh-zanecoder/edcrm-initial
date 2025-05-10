import { GoogleAuth } from 'google-auth-library';

export async function createTranscriptionTask(recordingUrl: string, callSid: string) {
  const project = process.env.GOOGLE_CLOUD_PROJECT!;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  const queue = process.env.GOOGLE_CLOUD_QUEUE || 'transcription-queue';
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/twilio/transcribe`;

  // Log environment variables (excluding sensitive data)
  console.log('Environment check:', {
    hasProject: !!project,
    location,
    queue,
    apiUrl: process.env.NEXT_PUBLIC_API_URL
  });

  // Initialize the auth client
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-tasks']
  });

  try {
    // Get the client
    const client = await auth.getClient();
    console.log('Successfully authenticated with Google Cloud');

    const task = {
      httpRequest: {
        httpMethod: 'POST',
        url,
        headers: { 'Content-Type': 'application/json' },
        body: Buffer.from(JSON.stringify({ recordingUrl, callSid })).toString('base64'),
      },
    };

    const cloudTasksUrl = `https://cloudtasks.googleapis.com/v2/projects/${project}/locations/${location}/queues/${queue}/tasks`;
    console.log('Attempting to create task at:', cloudTasksUrl);
    
    const response = await client.request({
      url: cloudTasksUrl,
      method: 'POST',
      data: { task }
    });

    console.log('Task created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Detailed error in createTranscriptionTask:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
      stack: error.stack
    });
    throw error;
  }
}