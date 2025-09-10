// models/Session.js
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    classGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGroup', required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    timezone: { type: String, default: 'Asia/Manila' },
    location: String,
    onlineLink: String,
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    status: {
      type: String,
      enum: ['scheduled', 'done', 'cancelled'],
      default: 'scheduled',
    },
    notes: String,
  },
  { timestamps: true }
);

sessionSchema.index({ classGroupId: 1, startAt: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
