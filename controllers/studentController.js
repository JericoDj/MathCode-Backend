// controllers/studentController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

/* ---------- Create Student ---------- */
export const createStudent = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, school, gradeLevel, address } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const student = await User.create({
      firstName,
      lastName,
      email,
      phone,
      school,
      gradeLevel,
      address,
      roles: ['student'],
      passwordHash: password,
    });

    res.status(201).json({ message: 'Student account created', student });
  } catch (err) {
    next(err);
  }
};

/* ---------- Update Student ---------- */
export const updateStudent = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'email', 'phone', 'profile', 'status', "school", "gradeLevel", "address"];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const student = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student updated', student });
  } catch (err) {
    next(err);
  }
};

/* ---------- Delete Student ---------- */
export const deleteStudent = async (req, res, next) => {
  try {
    const student = await User.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/* ---------- Get Users by Role ---------- */
export const getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.params;
    const users = await User.find({ roles: role }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

/* ---------- Get Linked Students for Parent ---------- */
export const getLinkedStudents = async (req, res, next) => {
  try {
    const { parentId } = req.params;
    const parent = await User.findById(parentId).populate('guardianOf', 'firstName lastName email status');
    if (!parent) return res.status(404).json({ message: 'Parent not found' });
    console.log(parent);
    return res.json({ parentId: parent._id, linkedStudents: parent.guardianOf });
  } catch (err) {
    next(err);
  }
};

/* ---------- Link Student to Parent ---------- */
export const linkStudentToParent = async (req, res, next) => {
  try {
    const { parentId, studentId } = req.params;

    const parent = await User.findById(parentId);
    const student = await User.findById(studentId);

    if (!parent || !student)
      return res.status(404).json({ message: 'Parent or student not found' });

    // Ensure the arrays exist
    if (!Array.isArray(parent.guardianOf)) parent.guardianOf = [];
    if (!Array.isArray(student.guardians)) student.guardians = [];

    // Add the relationship if not already there
    if (!parent.guardianOf.some(id => id.toString() === studentId))
      parent.guardianOf.push(studentId);

    if (!student.guardians.some(id => id.toString() === parentId))
      student.guardians.push(parentId);

    await parent.save();
    await student.save();

    // Optional: return populated relationship info
    const updatedParent = await User.findById(parentId)
      .populate('guardianOf', 'firstName lastName email roles status');
    const updatedStudent = await User.findById(studentId)
      .populate('guardians', 'firstName lastName email roles status');

    res.json({
      message: 'Student linked to parent successfully',
      parent: updatedParent,
      student: updatedStudent,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------- Unlink Student from Parent ---------- */
export const unlinkStudentFromParent = async (req, res, next) => {
  try {
    const { parentId, studentId } = req.params;

    const parent = await User.findById(parentId);
    const student = await User.findById(studentId);

    if (!parent || !student)
      return res.status(404).json({ message: 'Parent or student not found' });

    // Ensure arrays exist
    if (!Array.isArray(parent.guardianOf)) parent.guardianOf = [];
    if (!Array.isArray(student.guardians)) student.guardians = [];

    // Remove the relationship both ways
    parent.guardianOf = parent.guardianOf.filter(
      (id) => id.toString() !== studentId
    );
    student.guardians = student.guardians.filter(
      (id) => id.toString() !== parentId
    );

    await parent.save();
    await student.save();

    // Populate both sides for confirmation
    const updatedParent = await User.findById(parentId)
      .populate('guardianOf', 'firstName lastName email roles status');
    const updatedStudent = await User.findById(studentId)
      .populate('guardians', 'firstName lastName email roles status');

    res.json({
      message: 'Student unlinked from parent successfully',
      parent: updatedParent,
      student: updatedStudent,
    });
  } catch (err) {
    next(err);
  }
};
