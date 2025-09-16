// models/Course.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    stream: { type: String, enum: ['singapore-math', 'coding'], required: true },
    level: String, // e.g., "P3", "Beginner"
    term: {
      name: String,
      startDate: Date,
      endDate: Date,
      isSummer: { type: Boolean, default: false },
    },
    modality: { type: String, enum: ['in-person', 'online', 'hybrid'], default: 'in-person' },
    description: String,
    outcomes: [String],
    defaultSessionLengthMins: { type: Number, default: 60 },
    ageRange: {
      min: Number,
      max: Number,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.index({ stream: 1, active: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
