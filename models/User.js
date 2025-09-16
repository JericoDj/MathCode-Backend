import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }, // unique index here
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    roles: {
      type: [String],
      enum: ['student', 'parent', 'instructor', 'admin'],
      default: ['student'],
      index: true, // keep index here
    },
    status: { type: String, enum: ['active', 'invited', 'suspended'], default: 'active' },
    profile: {
      dob: Date,
      gender: { type: String, enum: ['male', 'female', 'other'], default: undefined },
      address: String,
      timezone: { type: String, default: 'Asia/Manila' },
    },
    guardianOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    guardians: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastLoginAt: Date,
  },
  { timestamps: true }
);

// Virtual fullName
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Methods
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Hooks
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Keep only what’s needed
userSchema.index({ status: 1 });

const User = mongoose.model('User', userSchema);
export default User;
