import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    // Common fields for both requested and processed sessions
    childId: { type: String, required: false }, //student
    studentName: { type: String, required: false }, // <-- added student name
    requestedBy: { type: String, required: true }, // parent

    // For requested sessions
    preferredDate: { type: Date, required: false },
    preferredTime: { type: String, required: false },
    notes: { type: String, required: false },

    // Status of the session
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'cancelled', 'scheduled', 'completed', 'no-show'],
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
