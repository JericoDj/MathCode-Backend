import nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";

export const EMAIL_USER = defineSecret("EMAIL_USER");
export const EMAIL_PASS = defineSecret("EMAIL_PASS");
export const SUPPORT_EMAIL = defineSecret("SUPPORT_EMAIL");

export function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER.value(),
      pass: EMAIL_PASS.value(),
    },
  });
}
