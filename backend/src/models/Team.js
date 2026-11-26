import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
        leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        maxMembers: { type: Number, default: 4, min: 2, max: 10 },
        skillsNeeded: [String],
        description: { type: String, default: '' },
        status: { type: String, enum: ['open', 'full', 'closed'], default: 'open' },
    },
    { timestamps: true }
);

export default mongoose.models.Team || mongoose.model('Team', teamSchema);