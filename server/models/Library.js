const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['library', 'bookstore'], default: 'library' },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  openingHours: { type: String, default: '9:00 AM - 6:00 PM' },
  contactNumber: { type: String, default: '' },
  website: { type: String, default: '' },
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  totalBooks: { type: Number, default: 0 },
  image: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Library', librarySchema);
