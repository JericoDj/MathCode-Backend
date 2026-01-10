// controllers/packageController.js
import Package from '../models/Package.js';

import { uploadToS3, deleteFromS3 } from "../services/s3.service.js";

export const createPackage = async (req, res, next) => {
  try { 
    res.status(201).json(await Package.create(req.body)); 
  } catch (err) { 
    next(err); 
  }
};

export const listMyPackages = async (req, res) => {
  try {
    const userId = req.body.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const items = await Package.find({ requestedBy: userId }).sort({ createdAt: -1 });

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch packages" });
  }
};


export const submitPaymentProof = async (req, res) => {
  try {
    const pkgId = req.params.id;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const packageData = await Package.findById(pkgId);
    if (!packageData) return res.status(404).json({ message: "Package not found" });

    // Delete old file if exists
    if (packageData.payment?.fileName) {
      await deleteFromS3(packageData.payment.fileName);
    }

    const fileName = `payment_proofs/${pkgId}_${Date.now()}.${file.originalname.split('.').pop()}`;

    const fileUrl = await uploadToS3({
      fileBuffer: file.buffer,
      fileName,
      mimeType: file.mimetype
    });

    packageData.payment = {
      method: "bank-transfer",
      fileName,
      url: fileUrl,
      submittedAt: new Date(),
      status: "submitted"
    };

    await packageData.save();

    res.json({
      success: true,
      message: "Payment proof uploaded",
      payment: packageData.payment
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const listPackages = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(200, parseInt(req.query.limit || '50', 10));
    const skip = (page - 1) * limit;
    const q = {};

    if (req.query.classGroupId) q.classGroupId = req.query.classGroupId;
    if (req.query.instructorId) q.instructorId = req.query.instructorId;
    if (req.query.status) q.status = req.query.status;

    // Optional date range filter
    if (req.query.from || req.query.to) {
      q.startAt = {};
      if (req.query.from) q.startAt.$gte = new Date(req.query.from);
      if (req.query.to) q.startAt.$lte = new Date(req.query.to);
    }

    const [items, total] = await Promise.all([
      Package.find(q).sort({ startAt: 1 }).skip(skip).limit(limit),
      Package.countDocuments(q),
    ]);
    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) { 
    next(err); 
  }
};

export const getPackage = async (req, res, next) => {
  try {
    const doc = await Package.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Package not found' });
    res.json(doc);
  } catch (err) { 
    next(err); 
  }
};

export const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // If payment data is being submitted, handle it specially
    if (updateData.paymentMethod || updateData.paymentProof) {
      const paymentData = {
        method: updateData.paymentMethod,
        proof: updateData.paymentProof,
        fileName: updateData.paymentFileName,
        fileSize: updateData.paymentFileSize,
        fileType: updateData.paymentFileType,
        submittedAt: new Date(),
        status: 'under_review'
      };

      // Set payment information
      updateData.payment = paymentData;
      updateData.paymentSubmittedAt = new Date();
      updateData.paymentStatus = 'under_review'; // Update payment status
      
      // Package status remains 'pending_payment' until payment is verified
      // Remove individual payment fields to avoid duplication
      delete updateData.paymentFileName;
      delete updateData.paymentFileSize;
      delete updateData.paymentFileType;
    }

    console.log("Updating package:", id, updateData);

    const doc = await Package.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!doc) return res.status(404).json({ message: 'Package not found' });
    
    res.json(doc);
  } catch (err) { 
    next(err); 
  }
};

export const deletePackage = async (req, res, next) => {
  try {
    const doc = await Package.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Package not found' });
    res.json({ ok: true });
  } catch (err) { 
    next(err); 
  }
};