const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedDepartment: {
    type: String,
    enum: ['HR', 'IT', 'Finance', 'Admin', 'General'],
    default: 'General'
  },
  defaultAssignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HelpdeskCategory', categorySchema);