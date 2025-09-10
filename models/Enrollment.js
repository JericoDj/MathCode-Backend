// models/Enrollment.js
import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassGroup', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    guardianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled', 'waitlisted'],
      default: 'pending',
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

enrollmentSchema.index({ studentId: 1, classGroupId: 1 }, { unique: true });
enrollmentSchema.index({ status: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
