import Billing from "../models/Billing.js";

// Get all billing
export const getAllBillings = async (req, res) => {
  try {
    const billings = await Billing.find().sort({ createdAt: -1 });
    res.json(billings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get billing by ID
export const getBillingById = async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id);
    if (!billing) return res.status(404).json({ message: "Billing not found" });
    res.json(billing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get billings by user
export const getBillingByUser = async (req, res) => {
  try {
    const billings = await Billing.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(billings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create billing
export const createBilling = async (req, res) => {
  try {
    const billing = await Billing.create(req.body);
    res.status(201).json(billing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Change billing status
export const updateBillingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const billing = await Billing.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!billing) return res.status(404).json({ message: "Billing not found" });
    res.json(billing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete billing
export const deleteBilling = async (req, res) => {
  try {
    const billing = await Billing.findByIdAndDelete(req.params.id);
    if (!billing) return res.status(404).json({ message: "Billing not found" });
    res.json({ message: "Billing deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
