// controllers/inquiryController.js
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
  dotenv.config();


export const submitInquiry = async (req, res, next) => {
  try {
    const { parentName, email, grade, topic, message, updates } = req.body;

    if (!parentName || !email || !message) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // generate ticket number
    const ticket = `T-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // configure transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;

    // email to support
    // await transporter.sendMail({
    //   from: `"Inquiry Bot" <${supportEmail}>`,
    //   to: supportEmail,
    //   subject: `New Inquiry (${ticket}) from ${parentName}`,
    //   html: `
    //     <h3>New Inquiry Received</h3>
    //     <p><strong>Name:</strong> ${parentName}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Child's Grade:</strong> ${grade || '-'}</p>
    //     <p><strong>Topic:</strong> ${topic || 'General'}</p>
    //     <p><strong>Updates:</strong> ${updates ? 'Yes, send updates' : 'No'} </p>
    //     <p><strong>Message:</strong><br>${message}</p>
    //     <hr />
    //     <p><strong>Ticket:</strong> ${ticket}</p>
    //     <p>Respond within 24 hours.</p>
    //   `
    // });

   await transporter.sendMail({
  from: `"MathCode Support" <${supportEmail}>`,
  cc: [supportEmail],
  to: [email],
  subject: `We received your inquiry (${ticket})`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e8e8e8; border-radius: 8px;">
      
      <h2 style="margin: 0 0 12px; color: #1a1a1a; font-weight: 600;">Thank you for reaching out!</h2>

      <p style="font-size: 15px; color: #444;">
        We’ve received your inquiry and one of our team members will respond within 
        <strong>1 business day</strong>.
      </p>

      <div style="margin: 18px 0; padding: 14px; background: #fafafa; border-radius: 6px; border: 1px solid #e6e6e6;">
        <p style="margin: 4px 0; font-size: 14px; color: #555;"><strong>Ticket:</strong> ${ticket}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #555;"><strong>Topic:</strong> ${topic || 'General'}</p>
        <p style="margin: 4px 0; font-size: 14px; color: #555;"><strong>Child’s Level:</strong> ${grade || '-'}</p>
      </div>

      <p style="font-size: 15px; margin: 16px 0 6px; color: #1a1a1a; font-weight: 600;">Your Message</p>
      
      <blockquote style="margin: 0 0 16px; padding: 12px 16px; background: #f4f7ff; border-left: 4px solid #3b7dff; border-radius: 6px; font-size: 14px; color: #333; line-height: 1.45;">
        ${message}
      </blockquote>

      <p style="font-size: 14px; color: #444; margin: 12px 0 20px;">
        We appreciate your interest and will be in touch shortly.
      </p>

      <p style="margin: 0; font-size: 14px; color: #1a1a1a; font-weight: 600;">— MathCode Support Team</p>

      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #ececec; font-size: 12px; color: #999;">
        If this wasn’t you, please ignore this email.
      </div>
    </div>
  `
});


    return res.json({
      success: true,
      message: 'Inquiry submitted successfully',
      ticket
    });

  } catch (err) {
    next(err);
  }
};
