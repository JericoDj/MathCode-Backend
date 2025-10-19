// controllers/packageController.js
import Package from '../models/Package.js';

export const createPackage = async (req, res, next) => {
  try { 
    res.status(201).json(await Package.create(req.body)); 
  } catch (err) { 
    next(err); 
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