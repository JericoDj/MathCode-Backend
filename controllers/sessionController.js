import Session from '../models/Session.js';
import User from '../models/User.js';

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private/Admin
export const getSessions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      studentId,
      tutorName,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by student
    if (studentId) {
      query.studentId = studentId;
    }

    // Filter by tutor
    if (tutorName) {
      query.tutorName = { $regex: tutorName, $options: 'i' };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sessions = await Session.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('studentId', 'firstName lastName email phone')
      .populate('parentId', 'firstName lastName email phone');

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private/Admin
export const getSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('studentId', 'firstName lastName email phone gradeLevel school')
      .populate('parentId', 'firstName lastName email phone');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new session
// @route   POST /api/sessions
// @access  Private/Admin
export const createSession = async (req, res, next) => {
  try {
    const {
      studentId,
      parentId,
      studentName,
      parentName,
      tutorName,
      subject,
      date,
      time,
      duration,
      status = 'scheduled',
      packageType,
      notes,
      meetingLink
    } = req.body;

    // Validate required fields
    if (!studentId || !parentId || !tutorName || !subject || !date || !time || !duration || !packageType) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if parent exists
    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    // Calculate credits based on duration
    const creditsUsed = calculateCredits(duration);

    // Check for scheduling conflicts (same student, same date/time)
    const conflictingSession = await Session.findOne({
      studentId,
      date: new Date(date),
      time,
      status: { $in: ['scheduled', 'in-progress'] }
    });

    if (conflictingSession) {
      return res.status(400).json({ 
        message: 'Student already has a session scheduled at this time' 
      });
    }

    // Check for tutor scheduling conflicts
    const tutorConflict = await Session.findOne({
      tutorName,
      date: new Date(date),
      time,
      status: { $in: ['scheduled', 'in-progress'] }
    });

    if (tutorConflict) {
      return res.status(400).json({ 
        message: 'Tutor already has a session scheduled at this time' 
      });
    }

    const session = new Session({
      studentId,
      parentId,
      studentName: studentName || `${student.firstName} ${student.lastName}`,
      parentName: parentName || `${parent.firstName} ${parent.lastName}`,
      tutorName,
      subject,
      date: new Date(date),
      time,
      duration,
      status,
      packageType,
      creditsUsed,
      notes,
      meetingLink
    });

    const createdSession = await session.save();

    // Populate the created session
    const populatedSession = await Session.findById(createdSession._id)
      .populate('studentId', 'firstName lastName email phone')
      .populate('parentId', 'firstName lastName email phone');

    res.status(201).json(populatedSession);
  } catch (error) {
    next(error);
  }
};

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private/Admin
export const updateSession = async (req, res, next) => {
  try {
    const {
      tutorName,
      subject,
      date,
      time,
      duration,
      status,
      packageType,
      notes,
      meetingLink,
      sessionNotes,
      rating,
      feedback
    } = req.body;

    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update fields
    if (tutorName !== undefined) session.tutorName = tutorName;
    if (subject !== undefined) session.subject = subject;
    if (date !== undefined) session.date = new Date(date);
    if (time !== undefined) session.time = time;
    if (duration !== undefined) {
      session.duration = duration;
      session.creditsUsed = calculateCredits(duration);
    }
    if (status !== undefined) session.status = status;
    if (packageType !== undefined) session.packageType = packageType;
    if (notes !== undefined) session.notes = notes;
    if (meetingLink !== undefined) session.meetingLink = meetingLink;
    if (sessionNotes !== undefined) session.sessionNotes = sessionNotes;
    if (rating !== undefined) session.rating = rating;
    if (feedback !== undefined) session.feedback = feedback;

    // Handle session start
    if (status === 'in-progress' && session.status === 'scheduled') {
      session.actualStartTime = new Date();
    }

    // Handle session completion
    if (status === 'completed' && session.status === 'in-progress') {
      session.actualEndTime = new Date();
    }

    const updatedSession = await session.save();

    const populatedSession = await Session.findById(updatedSession._id)
      .populate('studentId', 'firstName lastName email phone')
      .populate('parentId', 'firstName lastName email phone');

    res.json(populatedSession);
  } catch (error) {
    next(error);
  }
};

// @desc    Update session status
// @route   PATCH /api/sessions/:id/status
// @access  Private/Admin
export const updateSessionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Validate status transition
    if (!isValidStatusTransition(session.status, status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${session.status} to ${status}` 
      });
    }

    // Handle timing for status changes
    if (status === 'in-progress' && session.status === 'scheduled') {
      session.actualStartTime = new Date();
    } else if (status === 'completed' && session.status === 'in-progress') {
      session.actualEndTime = new Date();
    }

    session.status = status;
    const updatedSession = await session.save();

    const populatedSession = await Session.findById(updatedSession._id)
      .populate('studentId', 'firstName lastName email phone')
      .populate('parentId', 'firstName lastName email phone');

    res.json(populatedSession);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete session
// @route   DELETE /api/sessions/:id
// @access  Private/Admin
export const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Prevent deletion of in-progress or completed sessions
    if (session.status === 'in-progress') {
      return res.status(400).json({ 
        message: 'Cannot delete a session that is in progress' 
      });
    }

    await Session.findByIdAndDelete(req.params.id);

    res.json({ message: 'Session removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sessions by student
// @route   GET /api/sessions/student/:studentId
// @access  Private/Admin
export const getSessionsByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const query = { studentId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const sessions = await Session.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('parentId', 'firstName lastName email phone');

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sessions by tutor
// @route   GET /api/sessions/tutor/:tutorName
// @access  Private/Admin
export const getSessionsByTutor = async (req, res, next) => {
  try {
    const { tutorName } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query = { tutorName };
    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query)
      .sort({ date: 1, time: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('studentId', 'firstName lastName email phone gradeLevel')
      .populate('parentId', 'firstName lastName email phone');

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's sessions
// @route   GET /api/sessions/today
// @access  Private/Admin
export const getTodaySessions = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await Session.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .sort({ time: 1 })
    .populate('studentId', 'firstName lastName email phone gradeLevel')
    .populate('parentId', 'firstName lastName email phone');

    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate credits based on duration
function calculateCredits(duration) {
  if (duration <= 30) return 0.5;
  if (duration <= 60) return 1;
  if (duration <= 90) return 1.5;
  if (duration <= 120) return 2;
  return Math.ceil(duration / 60); // 1 credit per hour for longer sessions
}

// Helper function to validate status transitions
function isValidStatusTransition(currentStatus, newStatus) {
  // Allow any transition for admin users, but maintain logical restrictions
  const allowedTransitions = {
    'scheduled': ['in-progress', 'completed', 'cancelled', 'no-show'],
    'in-progress': ['completed', 'cancelled', 'no-show', 'scheduled'],
    'completed': ['scheduled', 'cancelled', 'no-show', 'in-progress'],
    'cancelled': ['scheduled', 'completed', 'no-show', 'in-progress'],
    'no-show': ['scheduled', 'completed', 'cancelled', 'in-progress']
  };

  return allowedTransitions[currentStatus]?.includes(newStatus) || false;
}