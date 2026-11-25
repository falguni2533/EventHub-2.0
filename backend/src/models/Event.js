import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [160, 'Event title must be 160 characters or fewer'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description must be 2000 characters or fewer'],
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: [60, 'Category must be 60 characters or fewer'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true,
    },
    venue: {
      type: String,
      trim: true,
      default: 'Campus Main Auditorium',
      maxlength: [160, 'Venue must be 160 characters or fewer'],
    },
    capacity: {
      type: Number,
      default: 100,
      min: [1, 'Capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'completed', 'cancelled'],
      default: 'published',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Event = mongoose.model('Event', eventSchema);

export default Event;
