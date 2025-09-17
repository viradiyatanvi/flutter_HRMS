const mongoose = require('mongoose');

const salaryComponentSchema = new mongoose.Schema({
  basic: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  conveyance: { type: Number, default: 0 },
  medicalAllowance: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },
  otherAllowances: { type: Number, default: 0 }
});

const deductionSchema = new mongoose.Schema({
  tds: { type: Number, default: 0 },
  pf: { type: Number, default: 0 },
  esi: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  loan: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 }
});

const bonusSchema = new mongoose.Schema({
  amount: { type: Number, default: 0 },
  description: { type: String, trim: true },
  date: { type: Date, default: Date.now }
});

const payrollSchema = new mongoose.Schema({
  employee: {
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
    required: true,
    min: 2000,
    max: 2100
  },
  salaryStructure: salaryComponentSchema,
  deductions: deductionSchema,
  bonuses: [bonusSchema],
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
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Paid', 'Cancelled'],
    default: 'Draft'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Cash', 'Cheque'],
    default: 'Bank Transfer'
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

payrollSchema.pre('save', function(next) {
  this.totalEarnings = Object.values(this.salaryStructure.toObject()).reduce((sum, value) => {
    return typeof value === 'number' ? sum + value : sum;
  }, 0);
  
  this.bonuses.forEach(bonus => {
    this.totalEarnings += bonus.amount;
  });
  
  this.totalDeductions = Object.values(this.deductions.toObject()).reduce((sum, value) => {
    return typeof value === 'number' ? sum + value : sum;
  }, 0);
  
  this.netSalary = this.totalEarnings - this.totalDeductions;
  
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);