import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studentName: {
      type: String,
      required: true,
      trim: true
    },
    parentName: {
      type: String,
      required: true,
      trim: true
    },
    tutorName: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true,
      min: 30,
      max: 240
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled'
    },
    packageType: {
      type: String,
      required: true,
      enum: ['1:1 Private Tutoring', '1:2 Small Group', '1:4 Group Class']
    },
    creditsUsed: {
      type: Number,
      required: true,
      min: 0.5
    },
    notes: {
      type: String,
      trim: true
    },
    meetingLink: {
      type: String,
      trim: true
    },
    materials: [{
      name: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    actualStartTime: Date,
    actualEndTime: Date,
    sessionNotes: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
sessionSchema.index({ studentId: 1, date: 1 });
sessionSchema.index({ tutorName: 1, date: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ date: 1 });

// Virtual for formatted date
sessionSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Instance method to check if session can be started
sessionSchema.methods.canStart = function() {
  return this.status === 'scheduled';
};

// Instance method to check if session can be completed
sessionSchema.methods.canComplete = function() {
  return this.status === 'in-progress';
};

// Static method to get sessions by date range
sessionSchema.statics.getSessionsByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1, time: 1 });
};

// Static method to get sessions by student
sessionSchema.statics.getSessionsByStudent = function(studentId) {
  return this.find({ studentId }).sort({ date: -1 });
};

// Static method to get sessions by tutor
sessionSchema.statics.getSessionsByTutor = function(tutorName) {
  return this.find({ tutorName }).sort({ date: -1 });
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;