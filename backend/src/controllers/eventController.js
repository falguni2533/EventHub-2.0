import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Feedback from '../models/Feedback.js';
import mongoose from 'mongoose';

/** GET /api/events/:id */
export const getEventDetails = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

/** POST /api/events/:id/register */
export const registerForEvent = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const eventId = req.params.id;
    const session = await mongoose.startSession();
    session.startTransaction();
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Event not found' });
    }
    const seatsLeft = (event.capacity ?? 0) - (event.seatsFilled ?? 0);
    if (seatsLeft <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Event is sold out' });
    }
    const existing = await Registration.findOne({ student: studentId, event: eventId }).session(session);
    if (existing) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Already registered' });
    }
    await Registration.create([{ student: studentId, event: eventId }], { session });
    // decrement seats
    event.seatsFilled = (event.seatsFilled ?? 0) + 1;
    await event.save({ session });
    await session.commitTransaction();
    res.status(201).json({ success: true, message: 'Registered successfully' });
  } catch (err) {
    next(err);
  }
};

/** POST /api/events/:id/cancel */
export const cancelRegistration = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const eventId = req.params.id;
    const session = await mongoose.startSession();
    session.startTransaction();
    const registration = await Registration.findOne({ student: studentId, event: eventId }).session(session);
    if (!registration) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Registration not found' });
    }
    await registration.updateOne({ status: 'cancelled' }, { session });
    const event = await Event.findById(eventId).session(session);
    if (event) {
      event.seatsFilled = Math.max((event.seatsFilled ?? 1) - 1, 0);
      await event.save({ session });
    }
    await session.commitTransaction();
    res.json({ success: true, message: 'Registration cancelled' });
  } catch (err) {
    next(err);
  }
};

/** POST /api/events/:id/feedback */
export const submitFeedback = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const eventId = req.params.id;
    const { rating, comment = '', tags = [] } = req.body;
    // verify registration and event passed
    const registration = await Registration.findOne({ student: studentId, event: eventId, status: { $ne: 'cancelled' } });
    if (!registration) return res.status(400).json({ error: 'Not registered for this event' });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (new Date(event.date) > new Date()) return res.status(400).json({ error: 'Feedback not allowed before event date' });
    // upsert feedback
    const feedback = await Feedback.findOneAndUpdate(
      { student: studentId, event: eventId },
      { rating, comment, tags },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: feedback });
  } catch (err) {
    next(err);
  }
};
