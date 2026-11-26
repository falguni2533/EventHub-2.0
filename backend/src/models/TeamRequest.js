import mongoose from 'mongoose';

const teamRequestSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['invite', 'join'], required: true },
        team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'cancelled'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

teamRequestSchema.index({ team: 1, from: 1, to: 1, type: 1, status: 1 });

export default mongoose.models.TeamRequest || mongoose.model('TeamRequest', teamRequestSchema);