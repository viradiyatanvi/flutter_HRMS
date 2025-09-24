const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetName: {
    type: String,
    required: true,
    trim: true
  },
  assetType: {
    type: String,
    required: true,
    enum: ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Accessory', 'Other']
  },
  assetId: {
    type: String,
    required: true,
    unique: true
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  specifications: {
    type: String,
    default: ''
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  warrantyExpiry: {
    type: Date
  },
  purchaseCost: {
    type: Number,
    required: true
  },
  currentStatus: {
    type: String,
    enum: ['Available', 'Allocated', 'Under Maintenance', 'Retired', 'Lost'],
    default: 'Available'
  },
  allocatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  allocationDate: {
    type: Date,
    default: null
  },
  expectedReturnDate: {
    type: Date,
    default: null
  },
  actualReturnDate: {
    type: Date,
    default: null
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
    default: 'Excellent'
  },
  location: {
    type: String,
    default: 'Office'
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

assetSchema.index({ allocatedTo: 1, currentStatus: 1 });
assetSchema.index({ assetType: 1, currentStatus: 1 });

module.exports = mongoose.model('Asset', assetSchema);