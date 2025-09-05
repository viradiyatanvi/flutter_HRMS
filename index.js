

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

app.listen(port, '0.0.0.0', (err) => {
  if (err) { console.log('Server failed to start', err); return; }
  console.log(`Server running on port ${port}`);
});
