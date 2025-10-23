import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, // This automatically creates an index
      lowercase: true, 
      trim: true 
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, select: false },

    // Google OAuth fields
    googleId: { type: String },
    photoURL: { type: String },
    emailVerified: { type: Boolean, default: false },

    roles: {
      type: [String],
      enum: ['student', 'parent', 'instructor', 'admin'],
      default: ['parent'],
      index: true,
    },

    address: {
      type: String,
      required: false,
      trim: true,
    },

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
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.hasPassword = function () {
  return !!this.passwordHash;
};

userSchema.methods.isGoogleUser = function () {
  return !!this.googleId;
};

/* ---------- Pre-save Hook for Hashing Password ---------- */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  
  if (this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

/* ---------- Indexing - FIXED: No duplicates ---------- */
userSchema.index({ status: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
// REMOVED: userSchema.index({ email: 1 }); // Email already indexed by unique: true

/* ---------- Static Methods ---------- */
userSchema.statics.findOrCreateGoogleUser = async function(googleData) {
  const {
    googleId,
    email,
    firstName,
    lastName,
    photoURL,
    emailVerified
  } = googleData;

  let user = await this.findOne({ googleId });
  if (user) return user;

  user = await this.findOne({ email });
  if (user) {
    user.googleId = googleId;
    user.photoURL = photoURL || user.photoURL;
    user.emailVerified = emailVerified || user.emailVerified;
    await user.save({ validateBeforeSave: false });
    return user;
  }

  user = await this.create({
    firstName: firstName || 'Google',
    lastName: lastName || 'User',
    email,
    googleId,
    photoURL,
    emailVerified: emailVerified || false,
    phone: '',
    roles: ['parent'],
    status: 'active'
  });

  return user;
};

const User = mongoose.model('User', userSchema);
export default User;