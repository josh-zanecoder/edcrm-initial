import ngrok from 'ngrok';
import { exec } from 'child_process';

// Start Next.js server
const nextProcess = exec('npm run dev');

nextProcess.stdout.on('data', (data) => {
  console.log(`Next.js: ${data}`);
});

nextProcess.stderr.on('data', (data) => {
  console.error(`Next.js Error: ${data}`);
});

// Wait for Next.js to start (give it 5 seconds)
setTimeout(async () => {
  try {
    // Connect to ngrok
    const url = await ngrok.connect({
      addr: 3000, // Next.js default port
      authtoken: process.env.NGROK_AUTH_TOKEN, // Optional: Add your ngrok auth token if you have one
    });
    
    console.log(`Ngrok tunnel established at: ${url}`);
    console.log(`Use this URL for your Twilio webhook: ${url}/api/twilio/voice`);
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await ngrok.kill();
      nextProcess.kill();
      process.exit();
    });
  } catch (err) {
    console.error('Ngrok error:', err);
    nextProcess.kill();
    process.exit(1);
  }
}, 5000); 