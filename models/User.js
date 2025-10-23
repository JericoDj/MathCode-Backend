import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, select: false }, // Removed required: true for Google OAuth

    // Google OAuth fields - REMOVED sparse: true from here
    googleId: { type: String },
    photoURL: { type: String },
    emailVerified: { type: Boolean, default: false },

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
      type: String,
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
      address: String,
      timezone: { type: String, default: 'Asia/Manila' },
    },
    
    credits: {
      type: Number,
      default: 0,
    },

    // ✅ Credit transactions array
    creditTransactions: [{
      type: {
        type: String,
        enum: ['credit', 'debit'],
      },
      amount: {
        type: Number,
        min: 0
      },
      reason: {
        type: String,
      },
      referenceId: {
        type: String
      },
      previousBalance: {
        type: Number,
      },
      newBalance: {
        type: Number,
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],

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
  if (!this.passwordHash) return false; // Handle Google OAuth users without password
  return bcrypt.compare(plain, this.passwordHash);
};

// Check if user has password set (for Google OAuth users)
userSchema.methods.hasPassword = function () {
  return !!this.passwordHash;
};

// Check if user is Google OAuth user
userSchema.methods.isGoogleUser = function () {
  return !!this.googleId;
};

/* ---------- Pre-save Hook for Hashing Password ---------- */
userSchema.pre('save', async function (next) {
  // Only hash password if it's modified and not already hashed
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  
  // Check if password is already hashed (starts with bcrypt pattern)
  if (this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

/* ---------- Indexing - FIXED: No duplicates ---------- */
userSchema.index({ status: 1 });
// Only one googleId index - using explicit index method instead of field option
userSchema.index({ googleId: 1 }, { sparse: true }); // For Google OAuth
userSchema.index({ email: 1 }); // For faster email lookups

/* ---------- Static Methods ---------- */
// Find or create Google user
userSchema.statics.findOrCreateGoogleUser = async function(googleData) {
  const {
    googleId,
    email,
    firstName,
    lastName,
    photoURL,
    emailVerified
  } = googleData;

  // Try to find by Google ID first
  let user = await this.findOne({ googleId });
  if (user) return user;

  // Try to find by email
  user = await this.findOne({ email });
  if (user) {
    // Link Google account to existing user
    user.googleId = googleId;
    user.photoURL = photoURL || user.photoURL;
    user.emailVerified = emailVerified || user.emailVerified;
    await user.save({ validateBeforeSave: false });
    return user;
  }

  // Create new user
  user = await this.create({
    firstName: firstName || 'Google',
    lastName: lastName || 'User',
    email,
    googleId,
    photoURL,
    emailVerified: emailVerified || false,
    phone: '',
    roles: ['parent'], // Default role
    status: 'active'
  });

  return user;
};

const User = mongoose.model('User', userSchema);
export default User;