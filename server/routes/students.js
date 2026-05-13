const express = require('express');
const Student = require('../models/Student');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();

// GET /api/students — Admin
router.get('/', protect, roleCheck('admin'), async (req, res) => {
  try {
    const { branch, semester, search } = req.query;
    let query = { role: 'student' };
    if (branch) query.branch = branch;
    if (semester) query.semester = Number(semester);
    if (search) query.name = { $regex: search, $options: 'i' };
    const students = await Student.find(query).select('-password').sort('-createdAt');
    res.json({ success: true, count: students.length, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/students — Admin
router.post('/', protect, roleCheck('admin'), async (req, res) => {
  try {
    const student = await Student.create({ ...req.body, role: 'student' });
    res.status(201).json({ success: true, student });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/students/:id — Admin
router.put('/:id', protect, roleCheck('admin'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/students/:id — Admin
router.delete('/:id', protect, roleCheck('admin'), async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/students/:id/marks
router.get('/:id/marks', protect, async (req, res) => {
  try {
    const Marks = require('../models/Marks');
    const marks = await Marks.find({ studentId: req.params.id }).sort('-uploadedAt');
    res.json({ success: true, marks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
