import mongoose from 'mongoose';

export const FEEDBACK_CATEGORIES = [
  'Speakers',
  'Content',
  'Venue',
  'Organization',
  'Food',
  'Registration',
  'Other',
];

export const FEEDBACK_SENTIMENTS = ['Positive', 'Negative', 'Neutral'];

export const FEEDBACK_PROVIDERS = [
  'gemini',
  'openai',
  'local-fallback',
];

const feedbackSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      trim: true,
      default: 'Anonymous',
      maxlength: [100, 'Student name must be 100 characters or fewer'],
    },
    category: {
      type: String,
      enum: FEEDBACK_CATEGORIES,
      default: 'Other',
      index: true,
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      default: null,
    },
    eventName: {
      type: String,
      trim: true,
      default: 'General Event',
      maxlength: [160, 'Event name must be 160 characters or fewer'],
      index: true,
    },
    feedback: {
      type: String,
      required: [true, 'Feedback text is required'],
      trim: true,
      maxlength: [5000, 'Feedback must be 5000 characters or fewer'],
    },
    sentiment: {
      type: String,
      enum: FEEDBACK_SENTIMENTS,
      required: true,
      index: true,
    },
    aiSummary: {
      type: String,
      trim: true,
      default: '',
    },
    aiSuggestions: {
      type: [String],
      default: [],
    },
    provider: {
      type: String,
      enum: FEEDBACK_PROVIDERS,
      default: 'local-fallback',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
