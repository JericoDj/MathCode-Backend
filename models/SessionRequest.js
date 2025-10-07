// models/SessionRequest.js
import mongoose from 'mongoose';

const sessionRequestSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  preferredDate: Date,
  preferredTime: String,
  notes: String,
  status: { type: String, enum: ['pending', 'approved', 'declined', 'cancelled'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('SessionRequest', sessionRequestSchema);