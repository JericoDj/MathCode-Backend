// controllers/userController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
// Remove the redirect-based routes since you're using frontend flow
export const googleAuthRedirect = async (req, res) => {
  res.status(410).json({ message: 'This OAuth flow is deprecated. Use frontend token flow instead.' });
};


// OAuth callback handler


// Initialize Google OAuth - returns auth URL for frontend
export const initGoogleAuth = async (req, res) => {
  try {
    console.log("running initialization");
    const { redirectUri, mode = 'login' } = req.body;
    
    if (!redirectUri) {
      return res.status(400).json({ 
        message: 'Redirect URI is required' 
      });
    }

    // Generate state parameter for security
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in temporary session (you might want to use Redis in production)
    req.session.oauthState = state;
    req.session.oauthMode = mode;
    req.session.oauthRedirectUri = redirectUri;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${process.env.BACKEND_URL}/api/users/auth/google/callback`,
      response_type: 'code',
      scope: 'openid profile email',
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    })}`;

    res.json({ 
      authUrl,
      state 
    });
  } catch (error) {
    console.error('Google OAuth init error:', error);
    res.status(500).json({ message: 'Failed to initialize Google OAuth' });
  }
};

// Handle Google OAuth callback
export const googleAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const { oauthState, oauthRedirectUri, oauthMode } = req.session;

    if (!code || !state) {
      return res.redirect(`${oauthRedirectUri}?error=missing_parameters`);
    }

    if (state !== oauthState) {
      return res.redirect(`${oauthRedirectUri}?error=invalid_state`);
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: `${process.env.BACKEND_URL}/api/users/auth/google/callback`
    });

    googleClient.setCredentials(tokens);

    // Get user info from Google
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.redirect(`${oauthRedirectUri}?error=invalid_token`);
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

    let isNewUser = false;

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.photoURL = photoURL || user.photoURL;
        user.emailVerified = emailVerified || user.emailVerified;
        await user.save({ validateBeforeSave: false });
      }

      user.lastLoginAt = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      // For signup mode, create new user
      if (oauthMode === 'signup') {
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
        isNewUser = true;
      } else {
        // For login mode, user doesn't exist
        return res.redirect(`${oauthRedirectUri}?error=user_not_found&email=${encodeURIComponent(email)}`);
      }
    }

    // Generate JWT token
    const jwtToken = signToken(user);

    // Redirect back to frontend with tokens
    const redirectUrl = `${oauthRedirectUri}?${new URLSearchParams({
      success: 'true',
      token: jwtToken,
      isNewUser: isNewUser.toString(),
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    })}`;

    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const { oauthRedirectUri } = req.session;
    res.redirect(`${oauthRedirectUri}?error=auth_failed`);
  }
};

// Complete Google signup for additional user info
export const completeGoogleSignup = async (req, res) => {
  try {
    const { token, phone, additionalData } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user with additional info
    if (phone) user.phone = phone;
    if (additionalData) {
      // Merge additional data
      Object.assign(user, additionalData);
    }

    await user.save();

    // Generate new token with updated user info
    const newToken = signToken(user);

    res.json({
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
      token: newToken
    });

  } catch (error) {
    console.error('Complete Google signup error:', error);
    res.status(500).json({ message: 'Failed to complete signup' });
  }
};


// Direct token verification (POST endpoint)
// controllers/userController.js - Fix the googleAuth function
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    console.log('Google auth request received');
    console.log('Using GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    
    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Create a new OAuth2Client instance for each request
    const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // This must match the token's audience
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    console.log('Google token verified for email:', payload.email);
    console.log('Token audience:', payload.aud);
    console.log('Expected audience:', process.env.GOOGLE_CLIENT_ID);

    // Verify the audience matches
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      console.error('Audience mismatch!');
      console.error('Token was issued for:', payload.aud);
      console.error('We expected:', process.env.GOOGLE_CLIENT_ID);
      return res.status(401).json({ message: 'Invalid token audience' });
    }

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture: photoURL,
      email_verified: emailVerified
    } = payload;

    // Rest of your existing code...
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
    console.error('Google auth error details:', error);
    console.error('Error message:', error.message);
    
    // More specific error handling
    if (error.message.includes('Wrong recipient')) {
      console.error('CLIENT_ID MISMATCH DETECTED');
      console.error('Frontend is using one client ID, backend expects another');
      return res.status(400).json({ 
        message: 'OAuth configuration error: Client ID mismatch between frontend and backend' 
      });
    }
    
    res.status(500).json({ message: 'Google authentication failed: ' + error.message });
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