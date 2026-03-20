const express = require('express');
const { body, validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All skills (public listing for students)
router.get('/', auth, async (req, res) => {
  try {
    const skills = await Skill.find()
      .populate('mentorId', 'name email points')
      .sort({ createdAt: -1 });
    res.json(skills);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// My skills (as mentor)
router.get('/my', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Students only' });
    }
    const skills = await Skill.find({ mentorId: req.user._id }).sort({ createdAt: -1 });
    res.json(skills);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add skill (student as mentor)
router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
  ],
  async (req, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Students only' });
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const skill = new Skill({
        title: req.body.title,
        category: req.body.category,
        mentorId: req.user._id,
      });
      await skill.save();
      res.status(201).json(skill);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Update skill
router.patch(
  '/:id',
  auth,
  [
    body('title').optional().trim().notEmpty(),
    body('category').optional().trim().notEmpty(),
  ],
  async (req, res) => {
    try {
      const skill = await Skill.findOne({ _id: req.params.id, mentorId: req.user._id });
      if (!skill) return res.status(404).json({ error: 'Skill not found' });
      if (req.body.title) skill.title = req.body.title;
      if (req.body.category) skill.category = req.body.category;
      await skill.save();
      res.json(skill);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Delete skill
router.delete('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findOneAndDelete({ _id: req.params.id, mentorId: req.user._id });
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json({ message: 'Skill deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
