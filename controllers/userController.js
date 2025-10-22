// controllers/userController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV === 'production' 
    ? 'https://math-code-web.vercel.app/api/users/auth/google/callback'
    : 'http://localhost:4000/api/users/auth/google/callback'
);

const signToken = (user) =>
  jwt.sign(
    { sub: user._id, roles: user.roles },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: '7d' }
  );

/* =========================================================
   AUTH + USER ACCOUNT MANAGEMENT
========================================================= */

// Google

// controllers/userController.js - Update Google OAuth functions

// Redirect to Google OAuth
export const googleAuthRedirect = async (req, res) => {
  try {
    const authorizeUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent',
      redirect_uri: 'http://localhost:4000/api/users/auth/google/callback'
    });
    
    res.redirect(authorizeUrl);
  } catch (error) {
    console.error('Google OAuth redirect error:', error);
    res.status(500).json({ message: 'Failed to initiate Google OAuth' });
  }
};

// OAuth callback handler
export const googleAuthCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect('http://localhost:5173?error=no_code');
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: 'http://localhost:4000/api/users/auth/google/callback'
    });
    
    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture: photoURL,
      email_verified: emailVerified
    } = payload;

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email }
      ]
    });

    const isNewUser = !user;

    if (!user) {
      user = await User.create({
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
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.photoURL = photoURL || user.photoURL;
        user.emailVerified = emailVerified || user.emailVerified;
        await user.save({ validateBeforeSave: false });
      }
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const jwtToken = signToken(user);

    // Redirect to frontend with token in URL
    const redirectUrl = `http://localhost:5173/auth-success?token=${jwtToken}&isNewUser=${isNewUser}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect('http://localhost:5173?error=auth_failed');
  }
};

// Direct token verification (POST endpoint)
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture: photoURL,
      email_verified: emailVerified
    } = payload;

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { googleId },
        { email }
      ]
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.photoURL = photoURL || user.photoURL;
        user.emailVerified = emailVerified || user.emailVerified;
        await user.save({ validateBeforeSave: false });
      }

      user.lastLoginAt = new Date();
      await user.save({ validateBeforeSave: false });

      const jwtToken = signToken(user);

      return res.json({
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          roles: user.roles,
          status: user.status,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        },
        token: jwtToken,
        isNewUser: false
      });
    }

    // Create new user
    user = await User.create({
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

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const jwtToken = signToken(user);

    return res.status(201).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        status: user.status,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
      },
      token: jwtToken,
      isNewUser: true
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};
// Complete Google signup with additional info (if autoCreate was false)
export const completeGoogleSignup = async (req, res, next) => {
  try {
    const {
      googleId,
      firstName,
      lastName,
      email,
      phone,
      password,
      roles
    } = req.body;

    // Verify the Google user data exists
    const existingUser = await User.findOne({ googleId });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this Google account' });
    }

    // Check if email is already in use
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const user = await User.create({
      firstName: firstName || 'Google',
      lastName: lastName || 'User',
      email,
      phone: phone || '',
      googleId,
      passwordHash: password, // Will be hashed by pre-save hook
      roles: roles && roles.length ? roles : ['student'],
      status: 'active'
    });

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const jwtToken = signToken(user);

    res.status(201).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        status: user.status,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        hasPassword: user.hasPassword(),
      },
      token: jwtToken,
    });
  } catch (error) {
    next(error);
  }
};

// Set password for existing Google user (who signed up without password)
export const setPasswordAfterGoogle = async (req, res, next) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.googleId) {
      return res.status(400).json({ message: 'User is not a Google OAuth user' });
    }

    // Set the password
    user.passwordHash = password; // Will be hashed by pre-save hook
    await user.save();

    res.json({
      message: 'Password set successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        hasPassword: user.hasPassword(),
      }
    });
  } catch (error) {
    next(error);
  }
};



// Register
export const registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, roles } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      roles: roles && roles.length ? roles : undefined,
      passwordHash: password, // pre-save hook hashes this
    });

    const token = signToken(user);

    res.status(201).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};

// Login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return res.status(401).json({ message: 'User not found' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid password' });

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles,
        status: user.status,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};

// Get my profile
export const getMe = async (req, res, next) => {
  try {
    const me = await User.findById(req.userId)
      .populate('guardians', 'firstName lastName email phone school gradeLevel address')
      .populate('guardianOf', 'firstName lastName email phone school gradeLevel address');

    if (!me) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: me._id,
      firstName: me.firstName,
      lastName: me.lastName,
      email: me.email,
      phone: me.phone,
      roles: me.roles,
      status: me.status,
      profile: me.profile,
      guardians: me.guardians,
      guardianOf: me.guardianOf,
      createdAt: me.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// Update my profile (basic)
export const updateMe = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'profile'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const me = await User.findByIdAndUpdate(req.userId, update, {
      new: true,
      runValidators: true,
    });

    res.json(me);
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   ADMIN USER MANAGEMENT
========================================================= */

// Admin: list users (with pagination)
export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.role) q.roles = req.query.role;
    if (req.query.status) q.status = req.query.status;

    const [items, total] = await Promise.all([
      User.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(q),
    ]);

    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// Admin: get single user
export const getUserById = async (req, res, next) => {
  try {
    const doc = await User.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'User not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// Admin: update user status (activate/suspend)
export const setUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'active'|'invited'|'suspended'
    const doc = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: 'User not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   PASSWORD MANAGEMENT
========================================================= */

// Authenticated: change password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    user.passwordHash = newPassword; // pre-save hook hashes automatically
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

// Request password reset (send OTP via email)
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save({ validateBeforeSave: false });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Your OTP Code for Password Reset',
      text: `Your password reset code is: ${otp}\n\nThis code will expire in 10 minutes.`,
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    next(err);
  }
};

// Reset password using OTP
export const resetPasswordWithOTP = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+passwordHash');

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.passwordHash = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};


// controllers/userController.js

// Admin: update user
export const updateUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      roles,
      status,
      address,
      school,
      gradeLevel,
      profile,
      credits  // Add credits here
    } = req.body;

    const updateData = {};
    
    // Only include fields that are provided in the request
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (roles !== undefined) updateData.roles = roles;
    if (status !== undefined) updateData.status = status;
    if (address !== undefined) updateData.address = address;
    if (school !== undefined) updateData.school = school;
    if (gradeLevel !== undefined) updateData.gradeLevel = gradeLevel;
    if (profile !== undefined) updateData.profile = profile;
    if (credits !== undefined) updateData.credits = credits;  // Add this line

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        status: user.status,
        address: user.address,
        school: user.school,
        gradeLevel: user.gradeLevel,
        profile: user.profile,
        credits: user.credits,  // Add this line to include credits in response
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    next(err);
  }
};


// controllers/userController.js

// Deduct credits from user
export const deductCredits = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { amount, reason, referenceId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid credit amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has sufficient credits
    if (user.credits < amount) {
      return res.status(400).json({ 
        message: 'Insufficient credits',
        currentCredits: user.credits,
        requiredCredits: amount 
      });
    }

    // Deduct credits
    user.credits -= amount;
    
    // Add to transaction history
    const transaction = {
      type: 'debit',
      amount: amount,
      reason: reason || 'Credit deduction',
      referenceId: referenceId,
      previousBalance: user.credits + amount, // balance before deduction
      newBalance: user.credits,
      timestamp: new Date()
    };

    // Initialize transactions array if it doesn't exist
    if (!user.creditTransactions) {
      user.creditTransactions = [];
    }
    
    user.creditTransactions.push(transaction);
    await user.save();

    res.json({
      message: 'Credits deducted successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits
      },
      transaction
    });
  } catch (err) {
    next(err);
  }
};

// Add credits to user
export const addCredits = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { amount, reason, referenceId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid credit amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add credits
    user.credits += amount;
    
    // Add to transaction history
    const transaction = {
      type: 'credit',
      amount: amount,
      reason: reason || 'Credit addition',
      referenceId: referenceId,
      previousBalance: user.credits - amount, // balance before addition
      newBalance: user.credits,
      timestamp: new Date()
    };

    if (!user.creditTransactions) {
      user.creditTransactions = [];
    }
    
    user.creditTransactions.push(transaction);
    await user.save();

    res.json({
      message: 'Credits added successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits
      },
      transaction
    });
  } catch (err) {
    next(err);
  }
};

// Get user credit transactions
export const getCreditTransactions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('creditTransactions credits firstName lastName');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        currentCredits: user.credits
      },
      transactions: user.creditTransactions || []
    });
  } catch (err) {
    next(err);
  }
};

// Check if user has sufficient credits (utility function for scheduling)
export const checkCredits = async (userId, requiredAmount) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      hasSufficientCredits: user.credits >= requiredAmount,
      currentCredits: user.credits,
      user: user
    };
  } catch (error) {
    throw error;
  }
};

// Deduct credits with pre-check (for scheduling system)
export const deductCreditsForScheduling = async (userId, amount, reason, referenceId) => {
  try {
    const creditCheck = await checkCredits(userId, amount);
    
    if (!creditCheck.hasSufficientCredits) {
      throw new Error(`Insufficient credits. Required: ${amount}, Available: ${creditCheck.currentCredits}`);
    }

    const user = creditCheck.user;
    user.credits -= amount;
    
    const transaction = {
      type: 'debit',
      amount: amount,
      reason: reason,
      referenceId: referenceId,
      previousBalance: user.credits + amount,
      newBalance: user.credits,
      timestamp: new Date()
    };

    if (!user.creditTransactions) {
      user.creditTransactions = [];
    }
    
    user.creditTransactions.push(transaction);
    await user.save();

    return {
      success: true,
      newBalance: user.credits,
      transaction
    };
  } catch (error) {
    throw error;
  }
};


export { googleClient };