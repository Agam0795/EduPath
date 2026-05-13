const express = require('express');
const Library = require('../models/Library');
const protect = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const router = express.Router();

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/libraries
router.get('/', protect, async (req, res) => {
  try {
    const libraries = await Library.find().populate('books', 'title author subject subjectCode rating');
    res.json({ success: true, count: libraries.length, libraries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/libraries/nearby?lat=&lng=&radius=10
router.get('/nearby', protect, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });
    const libraries = await Library.find().populate('books', 'title author subject subjectCode rating');
    const nearby = libraries
      .map(lib => ({
        ...lib.toObject(),
        distance: haversineDistance(Number(lat), Number(lng), lib.location.lat, lib.location.lng)
      }))
      .filter(lib => lib.distance <= Number(radius))
      .sort((a, b) => a.distance - b.distance);
    res.json({ success: true, count: nearby.length, libraries: nearby });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/libraries
router.post('/', protect, roleCheck('admin'), async (req, res) => {
  try {
    const library = await Library.create(req.body);
    res.status(201).json({ success: true, library });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/libraries/:id
router.put('/:id', protect, roleCheck('admin'), async (req, res) => {
  try {
    const library = await Library.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!library) return res.status(404).json({ success: false, message: 'Library not found' });
    res.json({ success: true, library });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/libraries/:id
router.delete('/:id', protect, roleCheck('admin'), async (req, res) => {
  try {
    await Library.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Library deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
