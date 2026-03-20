const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  teachingMode: {
    type: String,
    enum: ['in-person', 'online', 'flexible'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rescheduled', 'completed'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
