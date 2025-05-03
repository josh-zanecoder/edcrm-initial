import * as Brevo from '@getbrevo/brevo';

const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY as string);

export async function sendCredentialEmail(
  toEmail: string,
  fullName: string,
  password: string
) {
  const sendSmtpEmail = {
    to: [{ email: toEmail, name: fullName }],
    sender: { name: 'Your Company', email: 'josh@zanecoder.com' },
    subject: 'Your Sales Account Credentials',
    htmlContent: `
      <h3>Welcome ${fullName},</h3>
      <p>Your sales account has been created.</p>
      <p><strong>Email:</strong> ${toEmail}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please log in and change your password as soon as possible.</p>
    `
  };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', response);
  } catch (error: any) {
    // Enhanced error logging
    console.error('Brevo API Error Details:', {
      message: error?.response?.body?.message || error.message,
      code: error?.response?.body?.code,
      body: error?.response?.body,
      statusCode: error?.response?.status,
      headers: error?.response?.headers
    });
    
    // Construct a detailed error message
    const errorDetails = error?.response?.body
      ? `Brevo API Error: ${error.response.body.code} - ${error.response.body.message}`
      : error.message || 'Unknown error';
      
    throw new Error(errorDetails);
  }
}