// 



const mongoose = require('mongoose');

const enrollementSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Courses',
        required: true
    },
    enrollDate: {
        type: Date,
        default: Date.now
    },
    progress: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Enrolled', 'In-Progress', 'Completed'],
        default: 'Enrolled'
    },
    completedContent: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Enrollement', enrollementSchema);