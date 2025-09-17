// const mongoose = require('mongoose');

// const attendanceSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   date: {
//     type: Date,
//     required: true,
//     default: Date.now
//   },
//   punchIn: {
//     type: Date,
//     required: true
//   },
//   punchOut: {
//     type: Date
//   },
//   totalHours: {
//     type: Number,
//     default: 0
//   },
//   status: {
//     type: String,
//     enum: ['Present', 'Absent', 'Half-day', 'Late', 'On Leave'],
//     default: 'Present'
//   },
//   notes: {
//     type: String,
//     trim: true
//   },
//   correctionRequested: {
//     type: Boolean,
//     default: false
//   },
//   correctionReason: {
//     type: String,
//     trim: true
//   },
//   correctionStatus: {
//     type: String,
//     enum: ['Pending', 'Approved', 'Rejected'],
//     default: 'Pending'
//   }
// }, {
//   timestamps: true
// });

// attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// attendanceSchema.virtual('formattedDate').get(function() {
//   return this.date.toLocaleDateString('en-GB');
// });

// attendanceSchema.virtual('formattedPunchIn').get(function() {
//   return this.punchIn.toLocaleTimeString('en-IN', { 
//     hour: '2-digit', 
//     minute: '2-digit',
//     hour12: false 
//   });
// });

// attendanceSchema.virtual('formattedPunchOut').get(function() {
//   if (!this.punchOut) return '--:--';
//   return this.punchOut.toLocaleTimeString('en-IN', { 
//     hour: '2-digit', 
//     minute: '2-digit',
//     hour12: false 
//   });
// });

// attendanceSchema.virtual('formattedTotalHours').get(function() {
//   if (this.totalHours === 0) return '--';
//   const hours = Math.floor(this.totalHours);
//   const minutes = Math.round((this.totalHours - hours) * 60);
//   return `${hours}h ${minutes}m`;
// });

// attendanceSchema.virtual('isPunchedIn').get(function() {
//   return !this.punchOut;
// });

// module.exports = mongoose.model('Attendance', attendanceSchema);



const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
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

// Virtual for formatted date in Indian format (DD/MM/YYYY)
attendanceSchema.virtual('formattedDate').get(function() {
  if (!this.date) return '';
  const istDate = new Date(this.date.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
});

// Virtual for formatted punch in time in Indian format (HH:mm)
attendanceSchema.virtual('formattedPunchIn').get(function() {
  if (!this.punchIn) return '--:--';
  const istDate = new Date(this.punchIn.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
});

// Virtual for formatted punch out time in Indian format (HH:mm)
attendanceSchema.virtual('formattedPunchOut').get(function() {
  if (!this.punchOut) return '--:--';
  const istDate = new Date(this.punchOut.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toLocaleTimeString('en-IN', { 
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

// Virtual to check if user is punched in
attendanceSchema.virtual('isPunchedIn').get(function() {
  return !this.punchOut;
});

module.exports = mongoose.model('Attendance', attendanceSchema);