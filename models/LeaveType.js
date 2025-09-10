const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  maxDays: {
    type: Number,
    required: true,
    min: 0
  },
  carryForward: {
    type: Boolean,
    default: false
  },
  maxCarryForwardDays: {
    type: Number,
    default: 0,
    min: 0
  },
  requiresApproval: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  colorCode: {
    type: String,
    default: '#3B82F6'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeaveType', leaveTypeSchema);