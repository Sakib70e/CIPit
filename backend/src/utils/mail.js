import { Resend } from 'resend';

// Get your API key from resend.com
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetEmail = async (email, code) => {
  // If no API key is set, log the code to console for development
  if (!process.env.RESEND_API_KEY) {
    console.log("-----------------------------------------");
    console.log(`[DEVELOPMENT] Reset code for ${email}: ${code}`);
    console.log("-----------------------------------------");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'CIPIT App <onboarding@resend.dev>', // After verifying domain, change this.
      to: [email],
      subject: 'Your Password Reset Code 💧',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0077EE; text-align: center;">Verification Code</h2>
          <p>You requested a password reset for your <strong>CIPit</strong> account.</p>
          <div style="background-color: #f4f9ff; padding: 30px; border-radius: 10px; margin: 25px 0; text-align: center; border: 2px dashed #0077EE;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0077EE;">${code}</span>
          </div>
          <p>Please enter this 6-digit code in the app to reset your password. It will expire in 10 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">CIPit Water Delivery - Freshness at your doorstep</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    console.error('Email delivery failed:', err);
    throw err;
  }
};
