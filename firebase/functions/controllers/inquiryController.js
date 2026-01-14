import { getTransporter, SUPPORT_EMAIL } from "../services/mailer.js";

export async function submitInquiryFn(req, res) {
  try {
    const { email, parentName, message } = req.body;
    const transporter = getTransporter();

    await transporter.sendMail({
  from: `"MathCode Support" <${SUPPORT_EMAIL.value()}>`,
  to: email,
  subject: `We Received Your Inquiry`,
  html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #ffffff; border: 1px solid #E5E7EB; border-radius: 10px;">
    
    <h2 style="color:#1A3A2C; font-weight:700; margin-bottom:12px;">
      Thanks for Reaching Out!
    </h2>

    <p style="font-size:15px; color:#374151; margin-bottom:16px;">
      Hi ${parentName}, thank you for your inquiry. One of our team members will get back to you within 
      <strong>1 business day</strong>.
    </p>

    <p style="font-weight:600; margin-bottom:6px; color:#1A3A2C;">Your Message</p>

    <blockquote style="margin:0 0 18px; padding:12px 16px; background:#EEF2FF; border-left:4px solid #3B82F6; border-radius:6px; font-size:14px; color:#1F2937; line-height:1.45;">
      ${message}
    </blockquote>

    <p style="font-size:14px; color:#374151; margin-bottom:24px;">
      We appreciate your interest and will respond shortly.
    </p>

    <p style="font-size:14px; font-weight:600; color:#1A3A2C;">
      — MathCode Support Team
    </p>

    <div style="margin-top:28px; padding-top:12px; border-top:1px solid #E5E7EB; font-size:12px; color:#6B7280;">
      If you didn’t submit an inquiry, please ignore this email.
    </div>
  </div>
  `,
});

    return res.json({ success: true });
  } catch (err) {
    console.error("Inquiry error", err);
    res.status(500).json({ message: "Failed to send." });
  }
}
