const Session = require('../models/Session');
const Notification = require('../models/Notification');
const Skill = require('../models/Skill');

const cleanupSessions = async () => {
  try {
    // console.log('Running session cleanup...');

    // 1. Expire pending requests older than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const expiredSessions = await Session.find({
      status: 'pending',
      createdAt: { $lt: threeDaysAgo }
    }).populate('skillId');

    for (const session of expiredSessions) {
      const skillTitle = session.skillId ? session.skillId.title : 'session';
      
      // Notify learner
      await Notification.create({
        userId: session.learnerId,
        message: `Your request for "${skillTitle}" expired (no response for 3 days).`,
        type: 'warning',
        // relatedId is omitted as session is deleted
      });

      // Delete session
      await Session.findByIdAndDelete(session._id);
      console.log(`Deleted expired session ${session._id}`);
    }

    // 2. Reschedule accepted sessions older than 7 days from acceptance
    // "after the acceping till valid for 7 days only automatically resuduled to the next day"
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find sessions accepted more than 7 days ago that are not completed
    const overdueSessions = await Session.find({
      status: 'accepted',
      updatedAt: { $lt: sevenDaysAgo }
    }).populate('skillId');

    for (const session of overdueSessions) {
      // Reschedule to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Update session
      session.date = tomorrow;
      session.status = 'rescheduled'; 
      await session.save();

      const skillTitle = session.skillId ? session.skillId.title : 'session';
      
      // Notify learner
      await Notification.create({
        userId: session.learnerId,
        message: `Session for "${skillTitle}" auto-rescheduled to ${tomorrow.toLocaleDateString()} (7-day validity expired).`,
        type: 'info',
        relatedId: session._id,
        relatedModel: 'Session'
      });
      
      // Notify mentor
      await Notification.create({
        userId: session.mentorId,
        message: `Session for "${skillTitle}" auto-rescheduled to ${tomorrow.toLocaleDateString()} (7-day validity expired).`,
        type: 'info',
        relatedId: session._id,
        relatedModel: 'Session'
      });
      
      console.log(`Rescheduled session ${session._id}`);
    }
    
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
};

module.exports = cleanupSessions;
