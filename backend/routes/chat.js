const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const ChatRoom = require('../models/ChatRoom');
const Session = require('../models/Session');
const { auth } = require('../middleware/auth');

const router = express.Router();

// List chat rooms for current user
router.get('/rooms/my', auth, async (req, res) => {
  try {
    const asMentor = await ChatRoom.find({ mentorId: req.user._id })
      .populate('members', 'name')
      .sort({ updatedAt: -1 });
    const asMember = await ChatRoom.find({ members: req.user._id })
      .populate('members', 'name')
      .sort({ updatedAt: -1 });
    res.json({ asMentor, asMember });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create group chat room (mentor only)
router.post('/rooms', auth, [
  body('skill').trim().notEmpty(),
  body('date').isISO8601(),
  body('timeSlot').trim().notEmpty(),
  body('members').optional().isArray(),
], async (req, res) => {
  try {
    const hasMentorSessions = await Session.exists({ mentorId: req.user._id });
    if (!hasMentorSessions) {
      return res.status(403).json({ error: 'Only mentor can create group chats' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { skill, date, timeSlot, members = [] } = req.body;
    const room = new ChatRoom({
      mentorId: req.user._id,
      members,
      type: 'group',
      skill,
      date: new Date(date),
      timeSlot,
    });
    await room.save();
    const populated = await ChatRoom.findById(room._id).populate('members', 'name');
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add learner to group (mentor only)
router.post('/rooms/:roomId/members', auth, [
  body('userId').optional().isMongoId(),
  body('email').optional().isEmail(),
], async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only mentor can manage members' });
    }
    let targetUserId = req.body.userId;
    if (!targetUserId && req.body.email) {
      const User = require('../models/User');
      const u = await User.findOne({ email: req.body.email.toLowerCase() });
      if (!u) return res.status(404).json({ error: 'User not found' });
      targetUserId = u._id;
    }
    if (!targetUserId) return res.status(400).json({ error: 'userId or email required' });
    if (!room.members.some(m => m.toString() === targetUserId.toString())) {
      room.members.push(targetUserId);
      await room.save();
    }
    const populated = await ChatRoom.findById(room._id).populate('members', 'name');
    res.json(populated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Remove learner from group (mentor only)
router.delete('/rooms/:roomId/members/:userId', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only mentor can manage members' });
    }
    room.members = room.members.filter(m => m.toString() !== req.params.userId);
    await room.save();
    const populated = await ChatRoom.findById(room._id).populate('members', 'name');
    res.json(populated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete group chat (mentor only) - hard delete messages
router.delete('/rooms/:roomId', auth, async (req, res) => {
  res.status(403).json({ error: 'Chat deletion disabled' });
});

// Delete private chat (any participant) - hard delete messages
router.delete('/private/:sessionId', auth, async (req, res) => {
  res.status(403).json({ error: 'Chat deletion disabled' });
});

// Get messages for a session (only if session is accepted/completed and user is participant)
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const isParticipant =
      session.mentorId.toString() === req.user._id.toString() ||
      session.learnerId.toString() === req.user._id.toString();
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant in this session' });
    }
    if (!['accepted', 'rescheduled', 'completed'].includes(session.status)) {
      return res.status(403).json({ error: 'Chat is enabled only after session is accepted' });
    }
    const messages = await Chat.find({ sessionId: session._id })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send message
router.post(
  '/',
  auth,
  [
    body('sessionId').isMongoId().withMessage('Valid session ID required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  async (req, res) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
      const session = await Session.findById(req.body.sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      const isParticipant =
        session.mentorId.toString() === req.user._id.toString() ||
        session.learnerId.toString() === req.user._id.toString();
      if (!isParticipant) {
        return res.status(403).json({ error: 'Not a participant' });
      }
      if (!['accepted', 'rescheduled', 'completed'].includes(session.status)) {
        return res.status(403).json({ error: 'Chat enabled only after session is accepted' });
      }
      const chat = new Chat({
        sessionId: session._id,
        senderId: req.user._id,
        message: req.body.message,
      });
      await chat.save();
      const populated = await Chat.findById(chat._id).populate('senderId', 'name');
      res.status(201).json(populated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Get messages for a group room (mentor or members)
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const isAllowed =
      room.mentorId.toString() === req.user._id.toString() ||
      room.members.some(m => m.toString() === req.user._id.toString());
    if (!isAllowed) return res.status(403).json({ error: 'Not a member of this room' });
    const messages = await Chat.find({ roomId: room._id })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Send message to a group room
router.post('/rooms/:roomId/messages', auth, [
  body('message').trim().notEmpty(),
], async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const isAllowed =
      room.mentorId.toString() === req.user._id.toString() ||
      room.members.some(m => m.toString() === req.user._id.toString());
    if (!isAllowed) return res.status(403).json({ error: 'Not a member of this room' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const chat = new Chat({
      roomId: room._id,
      senderId: req.user._id,
      message: req.body.message,
    });
    await chat.save();
    const populated = await Chat.findById(chat._id).populate('senderId', 'name');
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;