const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  relationship: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  }
});

const bankDetailSchema = new mongoose.Schema({
  bankName: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  accountHolderName: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  }
});

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Aadhar', 'PAN', 'Passport', 'Driving License', 'Voter ID', 'Education Certificate', 'Experience Certificate', 'Other'],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  }
});

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', '']
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    }
  },
  bankDetails: bankDetailSchema,
  emergencyContacts: [emergencyContactSchema],
  documents: [documentSchema],
  designation: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  dateOfJoining: {
    type: Date
  },
  workLocation: {
    type: String,
    trim: true
  },
  reportingManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Intern', ''],
    default: 'Full-time'
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
userProfileSchema.index({ user: 1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);