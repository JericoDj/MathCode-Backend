import mongoose from 'mongoose';

const childSchema = new mongoose.Schema({
  _id: { type: String, required: false },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  gradeLevel: { type: String, required: false },
  school: { type: String, required: false },
  email: { type: String, required: false },
  phone: { type: String, required: false },
  age: { type: String, required: false },
});

const paymentSchema = new mongoose.Schema({
  method: { 
    type: String, 
    enum: ['card', 'paypal', 'bank-transfer', 'gcash', 'maya', 'grabpay'],
    required: false 
  },
  proof: { type: String, required: false },
  fileName: { type: String, required: false },
  fileSize: { type: Number, required: false },
  fileType: { type: String, required: false },
  submittedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'verified', 'reversed'],
    default: 'pending'
  }
});

const packageSessionSchema = new mongoose.Schema({
  sessionDate: { type: Date, required: false },
  sessionTime: { type: String, required: false },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  meetingLink: { type: String, required: false },
  notes: { type: String, required: false },
  teacher: { type: String, required: false },
  tutorId: { type: String, required: false },
  tutorName: { type: String, required: false },
  subject: { type: String, required: false },
  duration: { type: Number, default: 60 },
  // Track which session this is in the package sequence
  sessionNumber: { type: Number, required: false }
});

const packageSchema = new mongoose.Schema(
  {

    sku: {
      type: String,
      unique: true,
      sparse: true,
      default: function() {
        // Generate unique SKU
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `PKG-${dateStr}-${random}`;
      }
    },


    // Student/Parent Information (from original session)
    childId: { type: String, required: false }, 
    studentName: { type: String, required: false },
    child: { type: childSchema, required: false },
    requestedBy: { type: String, required: false }, 
    
    // Original session request details
    preferredDate: { type: Date, required: false },
    preferredTime: { type: String, required: false },
    timezone: { type: String, required: false },
    notes: { type: String, required: false },
    
    // Package Status (combines session status with package lifecycle)
    status: {
      type: String,
      enum: [
        'requested_assessment',
        'pending_payment',      
        'approved',             
        'scheduled',
        'completed', 
        'cancelled', 
        'expired',
        'no-show'
      ],
      default: 'pending_payment',
      required: false,
    },
    
    // Payment Information (from original session)
    paymentStatus: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'reversed'],
      default: 'pending'
    },
    payment: { type: paymentSchema, required: false },
    paymentMethod: { 
      type: String, 
      enum: ['card', 'paypal', 'bank-transfer', 'gcash', 'maya', 'grabpay'],
      required: false 
    },
    paymentProof: { type: String, required: false },
    paymentSubmittedAt: { type: Date, required: false },
    
    // Package Type Information
    packageType: { 
      type: String,
      enum: ['1-1', '1-2'],
      required: false 
    },
    packageName: { type: String, required: false },
    sessionsPerWeek: {
      type: String,
      enum: ['2', '3', '5'],
      required: false
    },
    planDuration: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'SEMI-ANNUAL', 'ANNUAL'],
      required: false
    },
    
    // Session Tracking
    totalSessions: { type: Number, required: false },
    usedSessions: { type: Number, default: 0 },
    remainingSessions: { type: Number, required: false },
    
    // Package Dates
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    
    // Session details (overall package level)
    subject: { type: String, required: false },
    grade: { type: String, required: false },
    price: { type: Number, required: false },
    meetingLink: { type: String, required: false }, // Default meeting link for all sessions
    
    // Individual sessions within the package
    packageSessions: [packageSessionSchema]
  },
  { timestamps: true }
);

export default mongoose.model('Package', packageSchema);