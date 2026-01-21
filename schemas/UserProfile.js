const { Schema, model } = require('mongoose');

const userProfileSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
    lastDailyClaim: {
        type: Date,
    },
    numberDailyRolls: {
        type: Number,
        default: 0,
    },
    streakCount: {
        type: Number,
        default: 0,
    },
    inventory: {
        type: [String],
        default: [],
    }
}, { timestamps: true }
);

module.exports = model('UserProfile', userProfileSchema);