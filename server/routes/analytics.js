const express = require('express');
const Student = require('../models/Student');
const Marks = require('../models/Marks');
const Book = require('../models/Book');
const Library = require('../models/Library');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();

function calculateGrade(obtained, max) {
  const pct = (obtained / max) * 100;
  if (pct >= 90) return 'O';
  if (pct >= 75) return 'A+';
  if (pct >= 60) return 'A';
  if (pct >= 50) return 'B+';
  if (pct >= 40) return 'B';
  return 'F';
}

// GET /api/analytics/overview
router.get('/overview', protect, roleCheck('admin'), async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ role: 'student' });
    const totalBooks = await Book.countDocuments();
    const totalLibraries = await Library.countDocuments();
    const allMarks = await Marks.find();

    let totalSubjects = 0, weakCount = 0, sumScores = 0;
    const branchSet = new Set();
    const students = await Student.find({ role: 'student' });
    students.forEach(s => branchSet.add(s.branch));

    const weakStudentIds = new Set();
    for (const record of allMarks) {
      for (const sub of record.subjects) {
        totalSubjects++;
        const pct = (sub.marksObtained / sub.maxMarks) * 100;
        sumScores += pct;
        if (pct < (sub.threshold || 40)) {
          weakCount++;
          weakStudentIds.add(record.studentId.toString());
        }
      }
    }

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalBooks,
        totalLibraries,
        weakStudents: weakStudentIds.size,
        avgScore: totalSubjects ? Math.round((sumScores / totalSubjects) * 10) / 10 : 0,
        branches: branchSet.size,
        totalMarksRecords: allMarks.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/subjects
router.get('/subjects', protect, roleCheck('admin'), async (req, res) => {
  try {
    const allMarks = await Marks.find().populate('studentId', 'name branch semester');
    const subjectStats = {};
    for (const record of allMarks) {
      for (const sub of record.subjects) {
        const pct = (sub.marksObtained / sub.maxMarks) * 100;
        if (!subjectStats[sub.subjectCode]) {
          subjectStats[sub.subjectCode] = {
            subjectCode: sub.subjectCode,
            subjectName: sub.subjectName,
            scores: [],
            pass: 0,
            fail: 0
          };
        }
        subjectStats[sub.subjectCode].scores.push(pct);
        if (pct >= (sub.threshold || 40)) subjectStats[sub.subjectCode].pass++;
        else subjectStats[sub.subjectCode].fail++;
      }
    }
    const result = Object.values(subjectStats).map(s => ({
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      avgScore: s.scores.length ? Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 10) / 10 : 0,
      maxScore: s.scores.length ? Math.round(Math.max(...s.scores) * 10) / 10 : 0,
      minScore: s.scores.length ? Math.round(Math.min(...s.scores) * 10) / 10 : 0,
      pass: s.pass,
      fail: s.fail,
      total: s.pass + s.fail,
      passRate: s.pass + s.fail > 0 ? Math.round((s.pass / (s.pass + s.fail)) * 100) : 0
    }));
    res.json({ success: true, subjects: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
