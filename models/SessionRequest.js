import mongoose from 'mongoose';

const sessionRequestSchema = new mongoose.Schema(
  {
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // child is also a User
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // parent
    preferredDate: Date,
    preferredTime: String,
    notes: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model('SessionRequest', sessionRequestSchema);
