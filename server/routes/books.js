const express = require('express');
const Book = require('../models/Book');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();

// GET /api/books
router.get('/', protect, async (req, res) => {
  try {
    const { subject, subjectCode, search } = req.query;
    let query = {};
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (subjectCode) query.subjectCode = subjectCode;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } }
    ];
    const books = await Book.find(query).populate('availableAt', 'name address location type openingHours');
    res.json({ success: true, count: books.length, books });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/books
router.post('/', protect, roleCheck('admin'), async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ success: true, book });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/books/:id
router.put('/:id', protect, roleCheck('admin'), async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, book });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/books/:id
router.delete('/:id', protect, roleCheck('admin'), async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
