import { onRequest } from "firebase-functions/v2/https";
import { submitInquiryFn } from "./controllers/inquiryController.js";
import { sendOTPFn } from "./controllers/authController.js";
import { subscribeEmailFn } from "./controllers/subscribeController.js";

export const testFunction = onRequest(
  { cors: true },
  async (_req, res) => res.json({
    success: true,
    message: "testFunction OK",
    time: new Date().toISOString(),
  })
);

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

export const subscribeEmail = onRequest(
  {
    cors: true,
    secrets: ["EMAIL_USER", "EMAIL_PASS", "SUPPORT_EMAIL"],
  },
  subscribeEmailFn
);
