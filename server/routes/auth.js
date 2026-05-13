const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await Student.findOne({ email });
    const passwordMatches = user ? await user.comparePassword(password) : false;
    if (!user || !passwordMatches)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        studentId: user.studentId,
        name: user.name,
        email: user.email,
        role: user.role,
        semester: user.semester,
        branch: user.branch,
        location: user.location
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/register (admin creates students too, but this allows self-register)
router.post('/register', async (req, res) => {
  try {
    const { studentId, name, email, password, semester, branch, role } = req.body;
    const existing = await Student.findOne({ $or: [{ email }, { studentId }] });
    if (existing) return res.status(400).json({ success: false, message: 'User already exists' });

    const user = await Student.create({ studentId, name, email, password, semester, branch, role: role || 'student' });
    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { _id: user._id, studentId: user.studentId, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
