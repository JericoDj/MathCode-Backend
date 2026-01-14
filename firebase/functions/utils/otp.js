import { onRequest } from "firebase-functions/v2/https";
import { getTransporter, SUPPORT_EMAIL } from "./services/mailer.js";

export const sendOTP = onRequest(
  {
    cors: true,
    secrets: [ "EMAIL_USER", "EMAIL_PASS", "SUPPORT_EMAIL" ],
  },
  async (req, res) => {
    try {
      const { email, otp } = req.body;
      const transporter = getTransporter();

      await transporter.sendMail({
        from: `"MathCode OTP" <${SUPPORT_EMAIL.value()}>`,
        to: email,
        subject: "Your OTP Code",
        html: `<h2>${otp}</h2>`
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "OTP failed" });
    }
  }
);
