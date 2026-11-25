import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'waitlisted', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    passCode: {
      type: String,
      trim: true,
      default: null,
    },
    passStatus: {
      type: String,
      enum: ['none', 'active', 'used', 'revoked'],
      default: 'none',
    },
    attendanceStatus: {
      type: String,
      enum: ['not_marked', 'present', 'absent'],
      default: 'not_marked',
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
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

registrationSchema.index({ student: 1, event: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
