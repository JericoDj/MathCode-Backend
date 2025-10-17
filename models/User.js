import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },

    roles: {
      type: [String],
      enum: ['student', 'parent', 'instructor', 'admin'],
      default: ['parent'],
      index: true,
    },

    // ✅ Added top-level address field
    address: {
      type: String,
      required: false,
      trim: true,
    },

    // ✅ School and Grade Level
    school: {
      type: String,
      required: false,
      trim: true,
    },
    gradeLevel: {
      type: String, // or Number if you prefer numeric
      required: false,
      trim: true,
    },

    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active',
    },

    profile: {
      dob: Date,
      gender: { type: String, enum: ['male', 'female', 'other'], default: undefined },
      address: String, // optional legacy support — can remove if redundant
      timezone: { type: String, default: 'Asia/Manila' },
    },

    guardianOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    guardians: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    lastLoginAt: Date,

    /* ---------- Password Reset Fields ---------- */
    resetPasswordOTP: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

/* ---------- Virtual fullName ---------- */
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

/* ---------- Instance Methods ---------- */
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

/* ---------- Pre-save Hook for Hashing Password ---------- */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

/* ---------- Indexing ---------- */
userSchema.index({ status: 1 });

const User = mongoose.model('User', userSchema);
export default User;
