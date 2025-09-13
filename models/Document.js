const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['Policy', 'Tax Form', 'Company Guideline', 'HR Form', 'Other'],
    default: 'Other'
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number // in bytes
  },
  fileType: {
    type: String // e.g., 'pdf', 'docx', 'xlsx'
  },
  targetAudience: [{
    type: String,
    enum: ['All', 'Admin', 'HR Manager', 'Team Manager', 'Employee', 'Finance'],
    default: ['All']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > this.publishDate;
      },
      message: 'Expiry date must be after publish date'
    }
  },
  version: {
    type: String,
    default: '1.0'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

documentSchema.virtual('formattedPublishDate').get(function() {
  return this.publishDate.toLocaleDateString('en-GB');
});

documentSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return this.expiryDate < new Date();
});

documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Document', documentSchema);