const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  punchIn: {
    type: Date,
    required: true
  },
  punchOut: {
    type: Date
  },
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half-day', 'Late', 'On Leave'],
    default: 'Present'
  },
  notes: {
    type: String,
    trim: true
  },
  correctionRequested: {
    type: Boolean,
    default: false
  },
  correctionReason: {
    type: String,
    trim: true
  },
  correctionStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-GB');
});

// Virtual for formatted punch in time
attendanceSchema.virtual('formattedPunchIn').get(function() {
  return this.punchIn.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
});

// Virtual for formatted punch out time
attendanceSchema.virtual('formattedPunchOut').get(function() {
  if (!this.punchOut) return '--:--';
  return this.punchOut.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
});

// Virtual for formatted total hours
attendanceSchema.virtual('formattedTotalHours').get(function() {
  if (this.totalHours === 0) return '--';
  const hours = Math.floor(this.totalHours);
  const minutes = Math.round((this.totalHours - hours) * 60);
  return `${hours}h ${minutes}m`;
});

// Virtual for checking if punched in
attendanceSchema.virtual('isPunchedIn').get(function() {
  return !this.punchOut;
});

module.exports = mongoose.model('Attendance', attendanceSchema);