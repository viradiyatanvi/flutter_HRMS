const mongoose = require('mongoose');

const payrollSettingSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  pfEnabled: {
    type: Boolean,
    default: true
  },
  pfPercentage: {
    type: Number,
    default: 12
  },
  esiEnabled: {
    type: Boolean,
    default: true
  },
  esiPercentage: {
    type: Number,
    default: 0.75
  },
  tdsEnabled: {
    type: Boolean,
    default: true
  },
  tdsSlabs: [{
    minAmount: Number,
    maxAmount: Number,
    percentage: Number
  }],
  professionalTax: {
    type: Number,
    default: 200
  },
  paymentSchedule: {
    type: String,
    enum: ['Monthly', 'Bi-Monthly', 'Weekly'],
    default: 'Monthly'
  },
  paymentDay: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  currency: {
    type: String,
    default: 'INR'
  },
  bankIntegration: {
    enabled: { type: Boolean, default: false },
    bankName: String,
    apiKey: String,
    apiSecret: String,
    lastSync: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PayrollSetting', payrollSettingSchema);