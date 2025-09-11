const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Not Started'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Update progress automatically when currentValue changes
goalSchema.pre('save', function(next) {
  if (this.isModified('currentValue')) {
    this.progress = Math.min(100, Math.round((this.currentValue / this.targetValue) * 100));
    
    // Update status based on progress
    if (this.progress === 0) {
      this.status = 'Not Started';
    } else if (this.progress > 0 && this.progress < 100) {
      this.status = 'In Progress';
    } else if (this.progress === 100) {
      this.status = 'Completed';
    }
  }
  next();
});

module.exports = mongoose.model('Goal', goalSchema);