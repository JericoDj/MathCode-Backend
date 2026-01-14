// functions/src/index.js
import { onRequest } from "firebase-functions/v2/https";
import { submitInquiryFn } from "./controllers/inquiryController.js";
import { sendOTPFn } from "./controllers/authController.js";

/* ============ TEST FUNCTION ============ */
export const testFunction = onRequest(
  { cors: true },
  async (req, res) => {
    return res.json({
      success: true,
      message: "testFunction OK",
      time: new Date().toISOString(),
    });
  }
);

/* ============ PROD FUNCTIONS ============ */
export const submitInquiry = onRequest(
  {
    cors: true,
    secrets: ["EMAIL_USER", "EMAIL_PASS", "SUPPORT_EMAIL"],
  },
  submitInquiryFn
);

export const sendOTP = onRequest(
  {
    cors: true,
    secrets: ["EMAIL_USER", "EMAIL_PASS", "SUPPORT_EMAIL"],
  },
  sendOTPFn
);
