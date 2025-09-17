const express = require('express');
const port = 8015;
const passport = require('./config/passport-jwt');
require('dotenv').config();
const cors = require('cors');

const app = express();
require('./config/db');

app.use(cors());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payslips', require('./routes/payslip'));
app.use('/api/announcements',require('./routes/announcements'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/performance', require('./routes/performance'));
// app.use('/api/training', require('./routes/training'));
// app.use('/api/training', require('./routes/trainingUser'));
app.use('/api/helpdesk/admin', require('./routes/helpdeskAdmin'));
app.use('/api/helpdesk', require('./routes/helpdeskUser'));
app.use('/api/calendar', require('./routes/calendarAdmin'));
app.use('/api/calendar', require('./routes/calendarUser'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/expense',require('./routes/Travel&Exprense'));
app.use('/api/payroll/admin', require('./routes/payrollAdmin'));
app.use('/api/payroll', require('./routes/payrollUser'));
app.use('/api/course',require('./routes/CourseRoutes'));

app.listen(port, '0.0.0.0', (err) => {
  if (err) { console.log('Server failed to start', err); return; }
  console.log(`Server running on port ${port}`);
});
