import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const onboardingSchema = new mongoose.Schema(
  {
    techInterests: { type: [String], default: [] },
    programmingLanguages: { type: [String], default: [] },
    otherProgrammingLanguage: { type: String, trim: true, maxlength: 80, default: '' },
    frameworksAndTools: { type: [String], default: [] },
    otherFramework: { type: String, trim: true, maxlength: 80, default: '' },
    codingProficiency: { type: String, trim: true, default: '' },
    projectExperience: { type: String, trim: true, default: '' },
    preferredRoles: { type: [String], default: [] },
    softSkills: { type: [String], default: [] },
    projectPreferences: { type: [String], default: [] },
  },
  { _id: false }
);

const socialLinksSchema = new mongoose.Schema(
  {
    github: { type: String, trim: true, maxlength: 250, default: '' },
    linkedin: { type: String, trim: true, maxlength: 250, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name must be 100 characters or fewer'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      minlength: [2, 'College name must be at least 2 characters'],
      maxlength: [150, 'College name must be 150 characters or fewer'],
    },
    studentId: {
      type: String,
      required: [true, 'Student ID / Enrollment number is required'],
      trim: true,
      minlength: [2, 'Student ID must be at least 2 characters'],
      maxlength: [50, 'Student ID must be 50 characters or fewer'],
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: 'Role must be either student or admin',
      },
      default: 'student',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio must be 500 characters or fewer'],
      default: '',
    },
    course: {
      type: String,
      trim: true,
      maxlength: [100, 'Course must be 100 characters or fewer'],
      default: '',
    },
    year: {
      type: String,
      trim: true,
      maxlength: [40, 'Year must be 40 characters or fewer'],
      default: '',
    },
    socialLinks: {
      type: socialLinksSchema,
      default: () => ({ github: '', linkedin: '' }),
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    profileCompletedAt: {
      type: Date,
      default: null,
    },
    onboarding: {
      type: onboardingSchema,
      default: () => ({}),
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [80, 'Designation must be 80 characters or fewer'],
      default: 'Admin',
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department must be 100 characters or fewer'],
      default: '',
    },
    accountStatus: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving whenever it has been created or modified
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Compares a plaintext candidate password against the stored bcrypt hash.
 */
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
