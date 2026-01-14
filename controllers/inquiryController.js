// controllers/inquiryController.js
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { URL } from "url";

export const submitInquiry = async (req, res) => {
  try {
    const { parentName, email, grade, topic, message, updates } = req.body;

    if (!parentName || !email || !message) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    console.log("[Inquiry] forwarding to Cloud Function…");

    const fnURL = new URL("https://us-central1-mathcode-1c100.cloudfunctions.net/submitInquiry");
    const transport = fnURL.protocol === "https:" ? httpsRequest : httpRequest;

    const payload = JSON.stringify({
      parentName,
      email,
      grade,
      topic,
      message,
      updates,
    });

    const options = {
      method: "POST",
      hostname: fnURL.hostname,
      path: fnURL.pathname,
      port: fnURL.port || (fnURL.protocol === "https:" ? 443 : 80),
      timeout: 8000,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const cloudResult = await new Promise((resolve, reject) => {
      const reqCF = transport(options, (resCF) => {
        let data = "";
        resCF.on("data", (chunk) => (data += chunk));
        resCF.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ error: "Invalid JSON from Cloud Function" });
          }
        });
      });

      reqCF.on("error", reject);
      reqCF.on("timeout", () => reject(new Error("Cloud Function timeout")));
      reqCF.write(payload);
      reqCF.end();
    });

    console.log("[CF Response]", cloudResult);

    return res.json({
      success: true,
      ticket: cloudResult.ticket ?? undefined,
      message: "Inquiry submitted successfully",
    });

  } catch (err) {
    console.error("Inquiry forwarding failed:", err.message);
    return res.status(500).json({
      message: "Failed to submit inquiry. Try again shortly.",
    });
  }
};
