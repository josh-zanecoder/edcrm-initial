import * as Brevo from "@getbrevo/brevo";
import { adminAuth } from "@/lib/firebase-admin";

const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY as string
);

export async function sendCredentialEmail(
  toEmail: string,
  fullName: string,
  password: string
) {
  const loginUrl = "https://edcrm-980800581325.us-west1.run.app/";

  // Generate the password reset link using Firebase Admin
  const resetLink = await adminAuth.generatePasswordResetLink(toEmail, {
    url: `${loginUrl}login`, // Redirect URL after password reset
  });

  const sendSmtpEmail = {
    to: [{ email: toEmail, name: fullName }],
    sender: { name: "EdStack.ai", email: "hello@edstack.ai" },
    subject: "Your EdStack CRM Account Credentials",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4a6ee0;">Welcome to EdStack CRM</h2>
        </div>
        
        <h3>Hello ${fullName},</h3>
        
        <p>Your sales account has been created successfully. You can now access the Edstack CRM platform using the credentials below:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${toEmail}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
        </div>
        
        <div style="background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #e65100;"><strong>Important Security Notice:</strong></p>
          <p style="margin-top: 10px;">For your security, please change your password immediately using the reset link below.</p>
        </div>
        
        <p>You have two options to get started:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${loginUrl}" style="background-color: #4a6ee0; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; margin-right: 10px;">Login to EdStacks CRM</a>
          
          <a href="${resetLink}" style="background-color: #e65100; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        
        <p style="color: #666; margin-top: 15px;">
          Click the "Reset Password" button to set up your new password securely.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          If you did not request this account, please contact our support team immediately.
        </p>
      </div>
    `,
  };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", response);
    return { success: true, response };
  } catch (error: any) {
    // Enhanced error logging
    console.error("Brevo API Error Details:", {
      message: error?.response?.body?.message || error.message,
      code: error?.response?.body?.code,
      body: error?.response?.body,
      statusCode: error?.response?.status,
      headers: error?.response?.headers,
    });

    // Construct a detailed error message
    const errorDetails = error?.response?.body
      ? `Brevo API Error: ${error.response.body.code} - ${error.response.body.message}`
      : error.message || "Unknown error";

    throw new Error(errorDetails);
  }
}
