const express = require('express');
const Marks = require('../models/Marks');
const Book = require('../models/Book');
const Student = require('../models/Student');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();

function analyzePerformance(subjects, threshold = 40) {
  return subjects.map(subject => {
    const percentage = (subject.marksObtained / subject.maxMarks) * 100;
    const effectiveThreshold = subject.threshold || threshold;
    const isWeak = percentage < effectiveThreshold;
    const grade = calculateGrade(subject.marksObtained, subject.maxMarks);
    return { ...subject.toObject ? subject.toObject() : subject, percentage: Math.round(percentage * 10) / 10, isWeak, grade };
  });
}

function calculateGrade(obtained, max) {
  const pct = (obtained / max) * 100;
  if (pct >= 90) return 'O';
  if (pct >= 75) return 'A+';
  if (pct >= 60) return 'A';
  if (pct >= 50) return 'B+';
  if (pct >= 40) return 'B';
  return 'F';
}

// GET /api/recommendations/:studentId
router.get('/:studentId', protect, async (req, res) => {
  try {
    const marks = await Marks.find({ studentId: req.params.studentId }).sort('-semester');
    if (!marks.length) return res.json({ success: true, weakSubjects: [], recommendations: [] });

    // Aggregate subject performance across all semesters for this student
    const subjectStats = {}; // code -> { subjectName, totalPct, count, threshold }
    for (const record of marks) {
      const analyzed = analyzePerformance(record.subjects);
      for (const s of analyzed) {
        if (!subjectStats[s.subjectCode]) {
          subjectStats[s.subjectCode] = { subjectCode: s.subjectCode, subjectName: s.subjectName, totalPct: 0, count: 0, threshold: s.threshold || 40 };
        }
        subjectStats[s.subjectCode].totalPct += s.percentage;
        subjectStats[s.subjectCode].count += 1;
      }
    }

    const aggregated = Object.values(subjectStats).map(s => ({
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      avgPercentage: Math.round((s.totalPct / s.count) * 10) / 10,
      threshold: s.threshold
    }));

    const weakSubjects = aggregated.filter(s => s.avgPercentage < (s.threshold || 40)).map(s => ({
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      percentage: s.avgPercentage,
      threshold: s.threshold,
    }));

    const weakCodes = weakSubjects.map(s => s.subjectCode);
    const recommendations = await Book.find({ subjectCode: { $in: weakCodes } })
      .populate('availableAt', 'name address location type openingHours rating')
      .sort('-rating');

    const grouped = weakSubjects.map(ws => ({
      subject: { subjectCode: ws.subjectCode, subjectName: ws.subjectName, percentage: ws.percentage },
      books: recommendations.filter(b => b.subjectCode === ws.subjectCode)
    }));

    res.json({
      success: true,
      aggregated,
      weakSubjects,
      recommendations: grouped,
      semestersConsidered: marks.map(m => m.semester)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/recommendations/stats — admin
router.get('/stats/overview', protect, roleCheck('admin'), async (req, res) => {
  try {
    const allMarks = await Marks.find().populate('studentId', 'name studentId branch');
    const subjectStats = {};
    for (const record of allMarks) {
      const analyzed = analyzePerformance(record.subjects);
      for (const s of analyzed) {
        if (!subjectStats[s.subjectCode]) {
          subjectStats[s.subjectCode] = { subjectCode: s.subjectCode, subjectName: s.subjectName, total: 0, weak: 0, avgScore: 0 };
        }
        subjectStats[s.subjectCode].total++;
        if (s.isWeak) subjectStats[s.subjectCode].weak++;
        subjectStats[s.subjectCode].avgScore += s.percentage;
      }
    }
    const statsArray = Object.values(subjectStats).map(s => ({
      ...s,
      avgScore: s.total ? Math.round((s.avgScore / s.total) * 10) / 10 : 0,
      weakPercent: s.total ? Math.round((s.weak / s.total) * 100) : 0
    }));
    res.json({ success: true, subjectStats: statsArray });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
