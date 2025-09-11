const mongoose = require('mongoose');

const evaluationQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'rating', 'multiple-choice'],
    default: 'text'
  },
  options: [String]
});

const selfEvaluationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  period: {
    startDate: Date,
    endDate: Date
  },
  questions: [evaluationQuestionSchema],
  responses: [{
    questionId: mongoose.Schema.Types.ObjectId,
    answer: mongoose.Schema.Types.Mixed,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Reviewed'],
    default: 'Draft'
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5
  },
  managerComments: {
    type: String,
    trim: true
  },
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SelfEvaluation', selfEvaluationSchema);