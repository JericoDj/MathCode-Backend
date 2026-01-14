import { getTransporter, SUPPORT_EMAIL } from "../services/mailer.js";

export async function sendOTPFn(req, res) {
  try {
    const { email, otp } = req.body;
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"MathCode OTP" <${SUPPORT_EMAIL.value()}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #ffffff; border: 1px solid #E5E7EB; border-radius: 10px;">
  
  <h2 style="color: #1A3A2C; font-weight: 700; margin-bottom: 8px; text-align:center;">Password Reset Code</h2>
  
  <p style="font-size: 15px; color: #374151; text-align:center; margin-bottom: 18px;">
    Your password reset code is below:
  </p>

  <div style="font-size:32px; font-weight:700; letter-spacing:3px; color:#1A3A2C; background:#ECFDF5; border-radius:8px; padding:16px; text-align:center; border:1px solid #D1FAE5;">
    ${otp}
  </div>

  <p style="font-size: 14px; margin-top: 20px; color: #374151;">
    This code will expire in <strong>10 minutes</strong>.
  </p>

  <p style="font-size: 14px; margin-top: 18px; color: #374151;">
    If you didn’t request a password reset, you can safely ignore this email.
  </p>

  <p style="font-size: 14px; margin-top: 24px; font-weight:600; color:#1A3A2C;">
    — MathCode Support Team
  </p>
</div>
`

    });

    return res.json({ success: true });
  } catch (err) {
    console.error("OTP error", err);
    res.status(500).json({ message: "OTP sending failed" });
  }
}
