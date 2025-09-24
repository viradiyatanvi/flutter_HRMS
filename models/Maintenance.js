const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issueType: {
    type: String,
    required: true,
    enum: ['Hardware', 'Software', 'Network', 'Physical Damage', 'Other']
  },
  issueDescription: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved', 'Cancelled'],
    default: 'Reported'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedDate: {
    type: Date,
    default: Date.now
  },
  startDate: {
    type: Date
  },
  resolvedDate: {
    type: Date
  },
  resolutionDetails: {
    type: String,
    default: ''
  },
  cost: {
    type: Number,
    default: 0
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);