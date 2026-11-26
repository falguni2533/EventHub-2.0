import mongoose from 'mongoose';

const lookingPostSchema = new mongoose.Schema(
    {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
        skills: [String],
        note: { type: String, default: '' },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

lookingPostSchema.index({ student: 1, event: 1 }, { unique: true });

export default mongoose.models.LookingPost || mongoose.model('LookingPost', lookingPostSchema);
