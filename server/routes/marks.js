const express = require('express');
const Marks = require('../models/Marks');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const multer = require('multer');
const Papa = require('papaparse');
const router = express.Router();
const sse = require('../sse');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/marks/:studentId
router.get('/:studentId', protect, async (req, res) => {
  try {
    const marks = await Marks.find({ studentId: req.params.studentId }).sort('-semester');
    res.json({ success: true, marks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/marks — create marks entry
router.post('/', protect, roleCheck('admin'), async (req, res) => {
  try {
    const marks = await Marks.create(req.body);
    // notify student subscribers (studentId stored as ObjectId)
    try { sse.publish(String(marks.studentId), 'marks:created', marks); } catch (e) { /* ignore */ }
    res.status(201).json({ success: true, marks });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/marks/:id — update marks
router.put('/:id', protect, roleCheck('admin'), async (req, res) => {
  try {
    const marks = await Marks.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!marks) return res.status(404).json({ success: false, message: 'Marks not found' });
    try { sse.publish(String(marks.studentId), 'marks:updated', marks); } catch (e) { /* ignore */ }
    res.json({ success: true, marks });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/marks/:id
router.delete('/:id', protect, roleCheck('admin'), async (req, res) => {
  try {
    const doc = await Marks.findByIdAndDelete(req.params.id);
    if (doc) {
      try { sse.publish(String(doc.studentId), 'marks:deleted', { id: req.params.id }); } catch (e) { /* ignore */ }
    }
    res.json({ success: true, message: 'Marks deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/marks/upload — CSV upload
router.post('/upload', protect, roleCheck('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const csvText = req.file.buffer.toString('utf8');
    const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    // Expected CSV: studentId, semester, subjectCode, subjectName, marksObtained, maxMarks, threshold
    const Student = require('../models/Student');
    const results = [];
    for (const row of data) {
      const student = await Student.findOne({ studentId: row.studentId });
      if (!student) continue;
      let marksDoc = await Marks.findOne({ studentId: student._id, semester: Number(row.semester) });
      const subjectEntry = {
        subjectCode: row.subjectCode,
        subjectName: row.subjectName,
        marksObtained: Number(row.marksObtained),
        maxMarks: Number(row.maxMarks) || 100,
        threshold: Number(row.threshold) || 40
      };
      if (marksDoc) {
        const idx = marksDoc.subjects.findIndex(s => s.subjectCode === row.subjectCode);
        if (idx >= 0) marksDoc.subjects[idx] = subjectEntry;
        else marksDoc.subjects.push(subjectEntry);
        await marksDoc.save();
      } else {
        marksDoc = await Marks.create({
          studentId: student._id,
          semester: Number(row.semester),
          subjects: [subjectEntry]
        });
      }
      results.push(marksDoc);
    }
    // publish update for affected students
    const affected = new Set(results.map(r => String(r.studentId)));
    for (const stuId of affected) {
      try { sse.publish(stuId, 'marks:bulk-upload', { message: `Bulk upload processed`, studentId: stuId }); } catch (e) { }
    }
    res.json({ success: true, message: `Processed ${results.length} records`, count: results.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
