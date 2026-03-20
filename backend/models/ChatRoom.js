const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: { type: String, enum: ['group'], default: 'group' },
  skill: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);