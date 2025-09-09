

const mongoose = require('mongoose');

const salaryComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Earning', 'Deduction'],
    required: true
  }
});

const payslipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  components: [salaryComponentSchema],
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Generated', 'Paid', 'Pending'],
    default: 'Generated'
  }
}, {
  timestamps: true
});

payslipSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

// Virtual for month name
payslipSchema.virtual('monthName').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[this.month - 1];
});

payslipSchema.virtual('periodDisplay').get(function() {
  return `${this.monthName} ${this.year}`;
});

payslipSchema.virtual('formattedBasicSalary').get(function() {
  return `₹${this.basicSalary.toFixed(0)}`;
});

payslipSchema.virtual('formattedTotalEarnings').get(function() {
  return `₹${this.totalEarnings.toFixed(0)}`;
});

payslipSchema.virtual('formattedTotalDeductions').get(function() {
  return `₹${this.totalDeductions.toFixed(0)}`;
});

// Virtual for formatted net salary
payslipSchema.virtual('formattedNetSalary').get(function() {
  return `₹${this.netSalary.toFixed(0)}`;
});

module.exports = mongoose.model('Payslip', payslipSchema);