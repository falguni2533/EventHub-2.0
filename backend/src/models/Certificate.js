import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      default: null,
      index: true,
    },
    participantName: {
      type: String,
      required: true,
      trim: true,
    },
    participantEmail: {
      type: String,
      trim: true,
      default: '',
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    eventDate: {
      type: String,
      default: '',
    },
    eventVenue: {
      type: String,
      default: '',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['valid', 'revoked'],
      default: 'valid',
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revocationReason: {
      type: String,
      default: '',
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
    seedKey: {
      type: String,
      trim: true,
      default: undefined,
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

// Prevent duplicate certificates for the same student and event
certificateSchema.index({ student: 1, event: 1 }, { unique: true });
certificateSchema.index({ seedKey: 1 }, { unique: true, sparse: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
