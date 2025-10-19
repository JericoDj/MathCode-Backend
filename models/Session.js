// models/Package.js
import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema(
  {
    sku: { type: String, required: false, unique: true, trim: true },
    title: { type: String, required: false, trim: true },
    stream: { type: String, enum: ['singapore-math', 'coding'], required: false },
    description: String,
    includes: {
      type: {
        type: String,
        enum: ['course', 'sessions', 'camp'],
        required: false,
      },
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      sessionCount: Number,
      dateRange: {
        start: Date,
        end: Date,
      },
    },
    pricePhp: { type: Number, required: false },
    currency: { type: String, default: 'PHP' },
    taxRate: { type: Number, default: 0 },
    visibility: { type: String, enum: ['public', 'internal'], default: 'public' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);


packageSchema.index({ stream: 1, active: 1 });

const Package = mongoose.model('Package', packageSchema);
export default Package;
