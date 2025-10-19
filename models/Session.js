import mongoose from 'mongoose';
const childSchema = new mongoose.Schema({
  _id: { type: String, required: false }, // optional manual _id
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  gradeLevel: { type: String, required: false },
  school: { type: String, required: false },
  email: { type: String, required: false },
  phone: { type: String, required: false },
  age: { type: String, required: false },
});
const sessionSchema = new mongoose.Schema(
  {
    // Linked student (if existing)
    childId: { type: String, required: false }, 
    studentName: { type: String, required: false },

    // Store full child info (for new or reference)
    child: { type: childSchema, required: false },

    // Parent who requested
    requestedBy: { type: String, required: true }, 

    // Session request details
    preferredDate: { type: Date, required: false },
    preferredTime: { type: String, required: false },
    timezone: { type: String, required: false }, // ✅ added timezone support
    notes: { type: String, required: false },

    // Status tracking
    status: {
      type: String,
      enum: [
  'requested_assessment', // free assessment requested
  'pending_payment',      // package selected, awaiting payment
  'approved',             // admin approved session (after payment or manual approval)
  'cancelled', 
  'scheduled', 
  'completed', 
  'no-show'
],
      default: 'pending',
      required: true,
    },

    // For processed sessions
    tutorId: { type: String, required: false },
    tutorName: { type: String, required: false },
    subject: { type: String, required: false },
    grade: { type: String, required: false },
    date: { type: Date, required: false },
    time: { type: String, required: false },
    duration: { type: Number, required: false },
    price: { type: Number, required: false },
    meetingLink: { type: String, required: false },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
