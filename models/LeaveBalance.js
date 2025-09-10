const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveType',
    required: true
  },
  totalDays: {
    type: Number,
    default: 0,
    min: 0
  },
  usedDays: {
    type: Number,
    default: 0,
    min: 0
  },
  carryForwardDays: {
    type: Number,
    default: 0,
    min: 0
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  }
}, {
  timestamps: true
});

leaveBalanceSchema.index({ user: 1, leaveType: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);