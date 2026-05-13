const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  marksObtained: { type: Number, required: true, min: 0 },
  maxMarks: { type: Number, required: true, default: 100 },
  threshold: { type: Number, default: 40 }
});

const marksSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  semester: { type: Number, required: true },
  subjects: [subjectSchema],
  uploadedAt: { type: Date, default: Date.now },
  academicYear: { type: String, default: '2023-24' }
});

module.exports = mongoose.model('Marks', marksSchema);
