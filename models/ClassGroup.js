// models/ClassGroup.js
import mongoose from 'mongoose';

const classGroupSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true }, // e.g. "P3 Alpha Tue/Thu 4pm"
    location: String,
    instructorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    scheduleRule: {
      daysOfWeek: [Number], // 0=Sunday
      startTime: String, // "16:00"
      durationMins: Number,
    },
    capacity: { type: Number, default: 12 },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['planned', 'active', 'completed', 'cancelled'],
      default: 'planned',
    },
  },
  { timestamps: true }
);

classGroupSchema.index({ courseId: 1, status: 1 });

const ClassGroup = mongoose.model('ClassGroup', classGroupSchema);
export default ClassGroup;
