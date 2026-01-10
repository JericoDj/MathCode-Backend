import https from "https";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import querystring from "querystring";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";

const return_url = `${process.env.APP_BASE_URL}/payments/paypal/return`;
const cancel_url = `${process.env.APP_BASE_URL}/payments/paypal/cancel`;

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_HOST = "api-m.paypal.com"; // LIVE
// For sandbox, change to "api-m.sandbox.paypal.com"

// 1. GENERATE ACCESS TOKEN
async function generateAccessToken() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64");
    const postData = querystring.stringify({ grant_type: "client_credentials" });

    const options = {
      hostname: PAYPAL_HOST,
      path: "/v1/oauth2/token",
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (!json.access_token) {
            return reject(new Error("PAYPAL: No access token returned"));
          }
          resolve(json.access_token);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// 2. CREATE ORDER
export const createPayPalOrder = async (req, res, next) => {
  try {
    const { invoiceId, amountPhp } = req.body;
    if (!invoiceId || !amountPhp) {
      return res.status(400).json({ message: "invoiceId and amountPhp required" });
    }

    const token = await generateAccessToken();

    const usdRate = 58; // configurable
    const amountUsd = (amountPhp / usdRate).toFixed(2);

    const body = JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: invoiceId,
          amount: {
            currency_code: "USD",
            value: amountUsd,
          },
        },
      ],
      application_context: {
        return_url: return_url,
        cancel_url: cancel_url,
        user_action: "PAY_NOW",
      },
    });

    const options = {
      hostname: PAYPAL_HOST,
      path: "/v2/checkout/orders",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const order = await new Promise((resolve, reject) => {
      const req2 = https.request(options, res2 => {
        let data = "";
        res2.on("data", c => (data += c));
        res2.on("end", () => resolve(JSON.parse(data)));
      });

      req2.on("error", reject);
      req2.write(body);
      req2.end();
    });

    res.json(order);

  } catch (err) {
    next(err);
  }
};

// 3. CAPTURE ORDER + UPDATE INVOICE + PAYMENT RECORD
export const capturePayPalOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: "orderId required" });

    const token = await generateAccessToken();

    const options = {
      hostname: PAYPAL_HOST,
      path: `/v2/checkout/orders/${orderId}/capture`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    const result = await new Promise((resolve, reject) => {
      const req2 = https.request(options, res2 => {
        let data = "";
        res2.on("data", c => (data += c));
        res2.on("end", () => resolve(JSON.parse(data)));
      });

      req2.on("error", reject);
      req2.end();
    });

    // --- SAFETY VALIDATION ---
    if (result.status !== "COMPLETED") {
      return res.status(400).json({
        message: "Capture not completed",
        status: result.status,
        details: result,
      });
    }

    const unit = result.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    if (!unit || !capture) {
      return res.status(400).json({ message: "Missing capture data" });
    }

    const invoiceId = unit.reference_id;
    const amountUsd = parseFloat(capture.amount.value);
    const usdRate = 58;
    const amountPhp = Math.round(amountUsd * usdRate);

    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) throw new Error("Invoice not found");

    const [payment] = await Payment.create(
      [{
        invoiceId,
        method: "paypal",
        amountUsd,
        amountPhp,
        status: "verified",
        paypalOrderId: orderId,
        paidAt: new Date(),
        raw: result,
      }],
      { session }
    );

    invoice.paymentIds.push(payment._id);
    invoice.balancePhp = Math.max(invoice.balancePhp - amountPhp, 0);

    if (invoice.balancePhp === 0) {
      invoice.status = "paid";
      invoice.paidAt = new Date();
    }

    await invoice.save({ session });
    await session.commitTransaction();

    res.json(payment);

  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};


export const setPayPalConfig = (req, res) => {
  res.json({ ok: true });
};

export const getPayPalConfig = (req, res) => {
  res.json({
    clientId: CLIENT_ID ? "********" : null,
    secret: SECRET ? "********" : null,
  });
};