import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import mongoose from 'mongoose';

/** GET /api/registrations */
export const getMyRegistrations = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const regs = await Registration.find({ student: studentId, status: { $ne: 'cancelled' } })
      .populate('event')
      .lean();
    res.json({ success: true, data: regs });
  } catch (err) {
    next(err);
  }
};
