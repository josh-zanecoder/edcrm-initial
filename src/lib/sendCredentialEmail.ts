import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

export async function sendCredentialEmail(to: string, name: string, password: string) {
  try {
    const mailOptions = {
      from: {
        name: 'EDTRACTS CRM',
        address: 'noreply@zanecoder.com'
      },
      to,
      subject: 'Welcome to EDCRM - Your Account Credentials',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to EDCRM, ${name}! 🎉</h2>
          <p>Your account has been successfully created. Here are your login credentials:</p>
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #666;">For security reasons, we recommend changing your password after your first login.</p>
          <p>You can log in to your account at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">${process.env.NEXT_PUBLIC_APP_URL}/login</a></p>
          <p>If you have any questions or need assistance, please contact your administrator.</p>
          <p>Best regards,<br>EDCRM Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Failed to send credential email:', error);
    throw error;
  }
}