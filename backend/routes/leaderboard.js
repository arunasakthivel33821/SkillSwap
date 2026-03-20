const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Public leaderboard (any authenticated user - students and admin)
router.get('/', auth, async (req, res) => {
  try {
    const leaders = await User.find({ role: 'student', points: { $gt: 0 } })
      .select('name email points')
      .sort({ points: -1 })
      .limit(50);
    res.json(leaders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
