const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  manage: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false }
});

const modulePermissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: ['User', 'Role', 'Award', 'Transfer', 'Resignation', 'Travel', 'Promotion','Payroll']
  },
  permissions: permissionSchema
});

const roleSchema = new mongoose.Schema({
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
  permissions: [modulePermissionSchema],
  accessLevel: {
    type: String,
    enum: ['Admin', 'HR Manager', 'Team Manager', 'Employee', 'Finance'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);