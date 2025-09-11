const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
const Goal = require('../models/Goal');
const Feedback = require('../models/Feedback');
const SelfEvaluation = require('../models/SelfEvaluation');
const User = require('../models/User');
const router = express.Router();

// Get performance dashboard data
router.get('/dashboard', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get assigned goals
    const goals = await Goal.find({ assignedTo: userId })
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    // Get received feedback
    const feedback = await Feedback.find({ givenTo: userId })
      .populate('givenBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get self-evaluation forms
    const selfEvaluations = await SelfEvaluation.find({ user: userId })
      .sort({ createdAt: -1 });
    
    // Calculate performance metrics
    const totalGoals = await Goal.countDocuments({ assignedTo: userId });
    const completedGoals = await Goal.countDocuments({ 
      assignedTo: userId, 
      status: 'Completed' 
    });
    const inProgressGoals = await Goal.countDocuments({ 
      assignedTo: userId, 
      status: 'In Progress' 
    });
    
    const averageFeedbackRating = await Feedback.aggregate([
      { $match: { givenTo: userId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    
    res.json({
      goals,
      feedback,
      selfEvaluations,
      metrics: {
        totalGoals,
        completedGoals,
        inProgressGoals,
        completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        averageRating: averageFeedbackRating[0]?.avgRating || 0
      }
    });
  } catch (err) {
    console.error('Performance dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get performance dashboard data
// router.get('/dashboard', authenticateJWT, isEmployee, async (req, res) => {
//   try {
//     const userId = req.user._id;
    
//     let goals = await Goal.find({
//       $or: [
//         { assignedTo: userId },
//         { assignedTo: userId.toString() }
//       ]
//     })
//     .populate('assignedBy', 'firstName lastName')
//     .sort({ createdAt: -1 });
    
//     if (goals.length === 0) {
//       goals = await Goal.find({})
//         .populate('assignedBy', 'firstName lastName')
//         .sort({ createdAt: -1 });
      
//       const allGoals = await Goal.find({});
//     //   console.log('All goals with assignedTo values:');
//       allGoals.forEach(goal => {
//         // console.log(`Goal: ${goal.title}, assignedTo: ${goal.assignedTo}, type: ${typeof goal.assignedTo}`);
//       });
//     }
    
//     const feedback = await Feedback.find({ givenTo: userId })
//       .populate('givenBy', 'firstName lastName')
//       .sort({ createdAt: -1 })
//       .limit(10);
    
//     const selfEvaluations = await SelfEvaluation.find({ user: userId })
//       .sort({ createdAt: -1 });
    
//     const totalGoals = goals.length;
//     const completedGoals = goals.filter(goal => goal.status === 'Completed').length;
//     const inProgressGoals = goals.filter(goal => goal.status === 'In Progress').length;
    
//     let averageRating = 0;
//     if (feedback.length > 0) {
//       const totalRating = feedback.reduce((sum, item) => sum + (item.rating || 0), 0);
//       averageRating = totalRating / feedback.length;
//     }
    
//     res.json({
//       goals,
//       feedback,
//       selfEvaluations,
//       metrics: {
//         totalGoals,
//         completedGoals,
//         inProgressGoals,
//         completionRate: totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
//         averageRating
//       }
//     });
//   } catch (err) {
//     console.error('Performance dashboard error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Get assigned goals
router.get('/goals', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;
    
    let query = { assignedTo: userId };
    if (status && status !== 'All') {
      query.status = status;
    }
    
    const goals = await Goal.find(query)
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Goal.countDocuments(query);
    
    res.json({
      goals,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Get goals error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// router.get('/goals', authenticateJWT, isEmployee, async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { page = 1, limit = 10, status } = req.query;
    
//     console.log('Fetching goals for user ID:', userId);
//     console.log('Query parameters:', { page, limit, status });
    
//     // First, let's check what format the assignedTo field has in the database
//     const sampleGoal = await Goal.findOne();
//     if (sampleGoal) {
//       console.log('Sample goal assignedTo:', sampleGoal.assignedTo, 'Type:', typeof sampleGoal.assignedTo);
//     }
    
//     // Let's try multiple approaches to find the goals
//     let query = {};
    
//     // Approach 1: Try with ObjectId
//     query.assignedTo = userId;
    
//     let totalGoals = await Goal.countDocuments(query);
//     console.log('Goals found with ObjectId query:', totalGoals);
    
//     // Approach 2: If no goals found, try with string ID
//     if (totalGoals === 0) {
//       query.assignedTo = userId.toString();
//       totalGoals = await Goal.countDocuments(query);
//       console.log('Goals found with string query:', totalGoals);
//     }
    
//     // Approach 3: If still no goals, try a more flexible approach
//     if (totalGoals === 0) {
//       const allGoals = await Goal.find({});
//       console.log('All goals in database:');
//       allGoals.forEach(goal => {
//         console.log(`Goal: ${goal.title}, assignedTo: ${goal.assignedTo}, type: ${typeof goal.assignedTo}`);
//       });
      
//       // Try to find any goals that might be assigned to this user
//       const goalsForUser = allGoals.filter(goal => 
//         goal.assignedTo && goal.assignedTo.toString() === userId.toString()
//       );
      
//       totalGoals = goalsForUser.length;
//       console.log('Goals found after manual filtering:', totalGoals);
//     }
    
//     // Add status filter if provided and not 'All'
//     if (status && status !== 'All') {
//       query.status = status;
//     }
    
//     if (totalGoals === 0) {
//       return res.json({
//         goals: [],
//         totalPages: 0,
//         currentPage: parseInt(page),
//         total: 0,
//         message: 'No goals found for this user'
//       });
//     }
    
//     // Fetch goals with pagination
//     const goals = await Goal.find(query)
//       .populate('assignedBy', 'firstName lastName')
//       .populate('assignedTo', 'firstName lastName')
//       .sort({ createdAt: -1 })
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .exec();
    
//     console.log('Goals retrieved:', goals.length);
    
//     res.json({
//       goals,
//       totalPages: Math.ceil(totalGoals / limit),
//       currentPage: parseInt(page),
//       total: totalGoals
//     });
    
//   } catch (err) {
//     console.error('Get goals error:', err);
//     res.status(500).json({ 
//       message: 'Server error',
//       error: err.message 
//     });
//   }
// });

// Update goal progress
router.put('/goals/:id/progress', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { currentValue, comment } = req.body;
    
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    if (goal.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    goal.currentValue = currentValue;
    
    if (comment) {
      goal.comments.push({
        user: req.user._id,
        comment
      });
    }
    
    await goal.save();
    await goal.populate('assignedBy', 'firstName lastName');
    
    res.json(goal);
  } catch (err) {
    console.error('Update goal progress error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get received feedback
router.get('/feedback/received', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, type } = req.query;
    
    let query = { givenTo: userId };
    if (type && type !== 'All') {
      query.feedbackType = type;
    }
    
    const feedback = await Feedback.find(query)
      .populate('givenBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Feedback.countDocuments(query);
    
    res.json({
      feedback,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Get feedback error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get self-evaluation forms
router.get('/self-evaluations', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;
    
    let query = { user: userId };
    if (status && status !== 'All') {
      query.status = status;
    }
    
    const evaluations = await SelfEvaluation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await SelfEvaluation.countDocuments(query);
    
    res.json({
      evaluations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Get self-evaluations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit self-evaluation
router.post('/self-evaluations/:id/submit', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { responses } = req.body;
    
    const evaluation = await SelfEvaluation.findById(req.params.id);
    
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation form not found' });
    }
    
    if (evaluation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (evaluation.status !== 'Draft') {
      return res.status(400).json({ message: 'Evaluation already submitted' });
    }
    
    evaluation.responses = responses;
    evaluation.status = 'Submitted';
    evaluation.submittedAt = new Date();
    
    await evaluation.save();
    res.json(evaluation);
  } catch (err) {
    console.error('Submit evaluation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes for managing performance
router.get('/admin/goals', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { page = 1, limit = 10, userId, status } = req.query;
    
    let query = {};
    if (userId) {
      query.assignedTo = userId;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    
    const goals = await Goal.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Goal.countDocuments(query);
    
    res.json({
      goals,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Admin get goals error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create goal (admin)
router.post('/admin/goals', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const goalData = {
      ...req.body,
      assignedBy: req.user._id
    };
    
    const goal = new Goal(goalData);
    await goal.save();
    
    await goal.populate('assignedTo', 'firstName lastName email');
    await goal.populate('assignedBy', 'firstName lastName');
    
    res.status(201).json(goal);
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update goal (admin)
router.put('/admin/goals/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const goal = await Goal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('assignedTo', 'firstName lastName email')
    .populate('assignedBy', 'firstName lastName');
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete goal (admin)
router.delete('/admin/goals/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const goal = await Goal.findByIdAndDelete(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Give feedback (admin/manager)
router.post('/admin/feedback', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const feedbackData = {
      ...req.body,
      givenBy: req.user._id
    };
    
    const feedback = new Feedback(feedbackData);
    await feedback.save();
    
    await feedback.populate('givenTo', 'firstName lastName email');
    await feedback.populate('givenBy', 'firstName lastName');
    
    res.status(201).json(feedback);
  } catch (err) {
    console.error('Give feedback error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create self-evaluation form (admin)
router.post('/admin/self-evaluations', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const evaluation = new SelfEvaluation(req.body);
    await evaluation.save();
    
    res.status(201).json(evaluation);
  } catch (err) {
    console.error('Create evaluation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;