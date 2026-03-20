const express = require('express');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Session = require('../models/Session');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(auth);
router.use(adminOnly);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [userCount, skillCount, sessionCount] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Skill.countDocuments(),
      Session.countDocuments(),
    ]);
    res.json({ userCount, skillCount, sessionCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// All students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ points: -1 });
    res.json(students);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// All skills
router.get('/skills', async (req, res) => {
  try {
    const skills = await Skill.find()
      .populate('mentorId', 'name email points')
      .sort({ createdAt: -1 });
    res.json(skills);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// All sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('learnerId', 'name email')
      .populate('mentorId', 'name email points')
      .populate('skillId', 'title category')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Leaderboard (top mentors by points)
router.get('/leaderboard', async (req, res) => {
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
