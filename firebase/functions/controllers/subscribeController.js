import { getTransporter, SUPPORT_EMAIL } from "../services/mailer.js";

export async function subscribeEmailFn(req, res) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Valid email required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"MathCode Updates" <${SUPPORT_EMAIL.value()}>`,
      to: normalizedEmail,
      cc: SUPPORT_EMAIL.value(),
      subject: `You're subscribed to MathCode updates`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 22px; background: #fff; border:1px solid #E5E7EB; border-radius: 8px;">
        
        <h2 style="color:#064E3B; font-weight:600; margin-bottom:14px;">
          Welcome aboard!
        </h2>

        <p style="color:#374151; font-size:15px; line-height:1.45; margin-bottom:18px;">
          You've been added to our update list. Expect tips, problem sets, and Kids Coding updates.
          Don't worry — we respect inboxes and never spam.
        </p>

        <p style="font-size:14px; color:#374151;">
          — MathCode Team
        </p>

        <div style="margin-top:20px; font-size:12px; color:#6B7280;">
          If you didn’t subscribe, feel free to ignore this message.
        </div>
      </div>
      `
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Subscribe error", err);
    res.status(500).json({ message: "Subscription failed" });
  }
}
