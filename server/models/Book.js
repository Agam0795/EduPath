const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  subject: { type: String, required: true },
  subjectCode: { type: String, required: true },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  isbn: { type: String, default: '' },
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  totalPages: { type: Number, default: 0 },
  publisher: { type: String, default: '' },
  year: { type: Number, default: 2020 },
  availableAt: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Library' }],
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', bookSchema);
