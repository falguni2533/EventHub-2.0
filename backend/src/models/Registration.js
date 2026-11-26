import mongoose from 'mongoose';
import { generatePassCode, generatePassToken } from '../utils/generatePassToken.js';

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
    passToken: {
      type: String,
      trim: true,
      default: undefined,
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
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
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

registrationSchema.index({ student: 1, event: 1 }, { unique: true });
registrationSchema.index({ passToken: 1 }, { unique: true, sparse: true });
registrationSchema.index({ seedKey: 1 }, { unique: true, sparse: true });

registrationSchema.pre('save', function ensurePassFields(next) {
  if (this.status === 'confirmed') {
    if (!this.passToken) {
      this.passToken = generatePassToken();
    }
    if (!this.passCode) {
      this.passCode = generatePassCode();
    }
    if (this.passStatus === 'none') {
      this.passStatus = 'active';
    }
  } else if (this.status === 'cancelled' && this.passStatus === 'active') {
    this.passStatus = 'revoked';
  }
  next();
});

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
