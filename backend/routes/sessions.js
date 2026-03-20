const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const Skill = require('../models/Skill');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();
const POINTS_PER_SESSION = 10;

// My sessions (as learner or mentor)
router.get('/my', auth, async (req, res) => {
  try {
    const asLearner = await Session.find({ learnerId: req.user._id })
      .populate('mentorId', 'name email contact')
      .populate('skillId', 'title category')
      .sort({ createdAt: -1 });
    const asMentor = await Session.find({ mentorId: req.user._id })
      .populate('learnerId', 'name email contact')
      .populate('skillId', 'title category')
      .sort({ createdAt: -1 });
    res.json({ asLearner, asMentor });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Request session (learner)
router.post(
  '/',
  auth,
  [
    body('skillId').isMongoId().withMessage('Valid skill ID required'),
    body('date').isISO8601().withMessage('Valid date required'),
    body('timeSlot').trim().notEmpty().withMessage('Time slot required'),
    body('teachingMode').isIn(['in-person', 'online', 'flexible']).withMessage('Invalid teaching mode'),
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
      const skill = await Skill.findById(req.body.skillId);
      if (!skill) return res.status(404).json({ error: 'Skill not found' });
      if (skill.mentorId.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: 'Cannot request your own skill' });
      }
      const session = new Session({
        learnerId: req.user._id,
        mentorId: skill.mentorId,
        skillId: skill._id,
        date: req.body.date,
        timeSlot: req.body.timeSlot,
        teachingMode: req.body.teachingMode,
        status: 'pending',
      });
      await session.save();
      const populated = await Session.findById(session._id)
        .populate('mentorId', 'name email')
        .populate('skillId', 'title category');

      // Notify mentor about the new request
      try {
        await Notification.create({
          userId: skill.mentorId,
          message: `New session request for "${skill.title}" from ${req.user.name}`,
          type: 'request',
          relatedId: session._id,
          relatedModel: 'Session',
        });
      } catch (err) {
        console.error('Error creating notification:', err);
      }

      res.status(201).json(populated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// Update session status (mentor: accept/reschedule, or mark completed)
router.patch('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      console.error(`Session not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    const { status } = req.body;
    if (!['pending', 'accepted', 'rescheduled', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const isMentor = session.mentorId.toString() === req.user._id.toString();
    const isLearner = session.learnerId.toString() === req.user._id.toString();

    if (status === 'accepted' || status === 'rescheduled') {
      if (!isMentor) return res.status(403).json({ error: 'Only mentor can accept/reschedule' });
      session.status = status;
      if (req.body.date) session.date = req.body.date;
      if (req.body.timeSlot) session.timeSlot = req.body.timeSlot;
      // Notify learner on accept/reschedule
      try {
        const skill = await Skill.findById(session.skillId);
        const skillTitle = skill ? skill.title : 'session';
        const baseMsg =
          status === 'accepted'
            ? `Your session request for "${skillTitle}" has been accepted.`
            : `Your session for "${skillTitle}" has been rescheduled.`;
        const details =
          req.body.date || req.body.timeSlot
            ? ` New schedule: ${req.body.date ? new Date(req.body.date).toLocaleDateString() : ''} ${req.body.timeSlot || ''}`.trim()
            : '';
        await Notification.create({
          userId: session.learnerId,
          message: `${baseMsg}${details ? ' ' + details : ''}`,
          type: status === 'accepted' ? 'success' : 'info',
          relatedId: session._id,
          relatedModel: 'Session',
        });
      } catch (err) {
        console.error('Error creating notification:', err);
      }
      let allowComplete = isMentor || req.user.role === 'admin';
      if (!allowComplete && isLearner) {
        const reqNotif = await Notification.findOne({
          userId: session.learnerId,
          type: 'completion_request',
          relatedId: session._id,
          read: false,
        });
        if (reqNotif) {
          allowComplete = true;
          reqNotif.read = true;
          await reqNotif.save();
        }
      }
      if (!allowComplete) return res.status(403).json({ error: 'Not authorized to mark completed' });
    } else if (status === 'completed') {
      let allowComplete = isMentor || req.user.role === 'admin';
      if (!allowComplete && isLearner) {
        const reqNotif = await Notification.findOne({
          userId: session.learnerId,
          type: 'completion_request',
          relatedId: session._id,
          read: false,
        });
        if (reqNotif) {
          allowComplete = true;
          reqNotif.read = true;
          await reqNotif.save();
        }
      }
      if (!allowComplete) return res.status(403).json({ error: 'Not authorized to mark completed' });
      
      // Award points to mentor when session is completed (only if not already completed)
      if (session.status !== 'completed' && session.mentorId) {
        await User.findByIdAndUpdate(session.mentorId, {
          $inc: { points: POINTS_PER_SESSION }
        });
      }
      session.status = 'completed';
    } else if (status === 'rejected') {
    if (!isMentor) return res.status(403).json({ error: 'Only mentor can reject' });

    try {
      const skill = await Skill.findById(session.skillId);
      const skillTitle = skill ? skill.title : 'session';

      await Notification.create({
        userId: session.learnerId,
        message: `Your session request for "${skillTitle}" has been rejected.`,
        type: 'warning'
      });
    } catch (err) {
      console.error('Error creating notification:', err);
    }

    const deletedSession = await Session.findByIdAndDelete(req.params.id);
    console.log('Rejecting session:', req.params.id);
    console.log('Notification data:', {
      userId: session.learnerId,
      message: `Your session request for "${skillTitle}" has been rejected.`,
      type: 'warning'
    });

    try {
      const notification = await Notification.create({
        userId: session.learnerId,
        message: `Your session request for "${skillTitle}" has been rejected.`,
        type: 'warning'
      });
      console.log('Notification created:', notification);
    } catch (err) {
      console.error('Error creating notification:', err);
    }

    console.log('Deleted session:', deletedSession);
    return res.json({ message: 'Session rejected and removed', _id: req.params.id, status: 'rejected' });
  } else {
    return res.status(400).json({ error: 'Invalid status change' });
  }

  await session.save();
  const updated = await Session.findById(session._id)
    .populate('mentorId', 'name email points')
    .populate('learnerId', 'name email')
    .populate('skillId', 'title category');
  res.json(updated);
} catch (e) {
  res.status(500).json({ error: e.message });
}
});
router.post('/:id/request-completion', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const isMentor = session.mentorId.toString() === req.user._id.toString();
    if (!isMentor && req.user.role !== 'admin') return res.status(403).json({ error: 'Only mentor or admin' });
    const skill = await Skill.findById(session.skillId);
    const skillTitle = skill ? skill.title : 'session';
    await Notification.create({
      userId: session.learnerId,
      message: `Confirm completion for "${skillTitle}"?`,
      type: 'completion_request',
      relatedId: session._id,
      relatedModel: 'Session',
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/confirm-completion', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const isLearner = session.learnerId.toString() === req.user._id.toString();
    if (!isLearner && req.user.role !== 'admin') return res.status(403).json({ error: 'Only learner or admin' });
    
    // Check if there's a pending completion request
    // Find all completion requests for this user and filter by session ID
    const allRequests = await Notification.find({
      userId: session.learnerId,
      type: 'completion_request',
      read: false,
    });
    
    // Find the one that matches this session (handles both ObjectId and string)
    const reqNotif = allRequests.find(n => 
      n.relatedId && (
        n.relatedId.toString() === session._id.toString() ||
        n.relatedId.equals(session._id)
      )
    );
    
    if (!reqNotif) {
      return res.status(400).json({ error: 'No pending completion request found' });
    }
    
    // Mark notification as read
    reqNotif.read = true;
    await reqNotif.save();
    
    // Mark session as completed
    if (session.status !== 'completed') {
      // Award points to mentor
      await User.findByIdAndUpdate(session.mentorId, {
        $inc: { points: POINTS_PER_SESSION }
      });
      session.status = 'completed';
      await session.save();
    }
    
    // Notify mentor
    const skill = await Skill.findById(session.skillId);
    const skillTitle = skill ? skill.title : 'session';
    await Notification.create({
      userId: session.mentorId,
      message: `Session "${skillTitle}" has been confirmed as completed. You earned ${POINTS_PER_SESSION} points!`,
      type: 'success',
      relatedId: session._id,
      relatedModel: 'Session',
    });
    
    const updated = await Session.findById(session._id)
      .populate('mentorId', 'name email points')
      .populate('learnerId', 'name email')
      .populate('skillId', 'title category');
    res.json(updated);
  } catch (e) {
    console.error('Error confirming completion:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/decline-completion', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const isLearner = session.learnerId.toString() === req.user._id.toString();
    if (!isLearner && req.user.role !== 'admin') return res.status(403).json({ error: 'Only learner or admin' });
    
    // Mark all completion requests for this session as read
    // Find all and update individually to handle ObjectId/string mismatch
    const allRequests = await Notification.find({
      userId: session.learnerId,
      type: 'completion_request',
      read: false,
    });
    
    // Update the ones that match this session
    for (const notif of allRequests) {
      if (notif.relatedId && (
        notif.relatedId.toString() === session._id.toString() ||
        (notif.relatedId.equals && notif.relatedId.equals(session._id))
      )) {
        notif.read = true;
        await notif.save();
      }
    }
    
    const skill = await Skill.findById(session.skillId);
    const skillTitle = skill ? skill.title : 'session';
    await Notification.create({
      userId: session.mentorId,
      message: `Learner declined completion for "${skillTitle}".`,
      type: 'warning',
      relatedId: session._id,
      relatedModel: 'Session',
    });
    
    res.json({ ok: true, message: 'Completion request declined' });
  } catch (e) {
    console.error('Error declining completion:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

