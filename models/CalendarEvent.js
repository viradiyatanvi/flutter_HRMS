const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  eventType: {
    type: String,
    enum: ['Holiday', 'Meeting', 'Training', 'Birthday', 'Event', 'Reminder'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  department: {
    type: String,
    enum: ['All', 'HR', 'IT', 'Finance', 'Sales', 'Marketing', 'Operations'],
    default: 'All'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Yearly', null],
    default: null
  },
  recurrenceEndDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for formatted dates
calendarEventSchema.virtual('formattedStartDate').get(function() {
  return this.startDate.toLocaleDateString('en-GB');
});

calendarEventSchema.virtual('formattedEndDate').get(function() {
  return this.endDate ? this.endDate.toLocaleDateString('en-GB') : '';
});

calendarEventSchema.virtual('duration').get(function() {
  if (!this.endDate) return '1 day';
  const diffTime = Math.abs(this.endDate - this.startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
});

calendarEventSchema.index({ startDate: 1, eventType: 1 });
calendarEventSchema.index({ department: 1, isActive: 1 });

calendarEventSchema.set('toJSON', { virtuals: true });
calendarEventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);