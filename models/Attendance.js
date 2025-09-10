// models/Attendance.js
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'excused'],
      default: 'present',
    },
    checkInAt: Date,
    checkOutAt: Date,
    remarks: String,
  },
  { timestamps: true }
);

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
