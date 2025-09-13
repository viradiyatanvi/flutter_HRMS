const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  videoUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  order: {
    type: Number,
    default: 0
  }
});

const trainingCourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // in hours
    default: 0
  },
  modules: [moduleSchema],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingCourse'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  targetRoles: [{
    type: String,
    enum: ['Admin', 'HR Manager', 'Team Manager', 'Employee', 'Finance']
  }],
  thumbnail: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TrainingCourse', trainingCourseSchema);