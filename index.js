const express = require('express');
const port = 8015;
const passport = require('./config/passport-jwt');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const uploadDirs = [
    path.join(__dirname, 'Uploads', 'Course'),
    path.join(__dirname, 'Uploads', 'Certificate'),
    path.join(__dirname, 'Uploads', 'ProfileImages'),
    path.join(__dirname, 'Uploads', 'Documents')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

const app = express();
require('./config/db');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payslips', require('./routes/payslip'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/performance', require('./routes/performance'));
app.use('/api/helpdesk/admin', require('./routes/helpdeskAdmin'));
app.use('/api/helpdesk', require('./routes/helpdeskUser'));
app.use('/api/calendar', require('./routes/calendarAdmin'));
app.use('/api/calendar', require('./routes/calendarUser'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/expense', require('./routes/Travel&Exprense'));
app.use('/api/payroll/admin', require('./routes/payrollAdmin'));
app.use('/api/payroll', require('./routes/payrollUser'));
app.use('/api/course', require('./routes/CourseRoutes'));

// Download endpoint for PDFs
app.get('/api/download/:type/:filename', (req, res) => {
    const { type, filename } = req.params;
    const filePath = path.join(__dirname, 'Uploads', type, filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, filename, (err) => {
            if (err) {
                res.status(500).json({ msg: 'Download failed', err: err.message });
            }
        });
    } else {
        res.status(404).json({ msg: 'File not found' });
    }
});

app.listen(port, '0.0.0.0', (err) => {
    if (err) { console.log('Server failed to start', err); return; }
    console.log(`Server running on port ${port}`);
});



// const express = require('express');
// const port = 8015;
// const passport = require('./config/passport-jwt');
// require('dotenv').config();
// const cors = require('cors');
// const path = require('path');
// const fs = require('fs');

// const uploadDirs = [
//     path.join(__dirname, 'Uploads', 'Course'),
//     path.join(__dirname, 'Uploads', 'Certificate'),
//     path.join(__dirname, 'Uploads', 'ProfileImages'),
//     path.join(__dirname, 'Uploads', 'Documents')
// ];

// uploadDirs.forEach(dir => {
//     if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, { recursive: true });
//         console.log(`Created directory: ${dir}`);
//     }
// });

// const app = express();
// require('./config/db');

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Serve static files
// app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// app.use(passport.initialize());

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/roles', require('./routes/roles'));
// app.use('/api/dashboard', require('./routes/dashboard'));
// app.use('/api/attendance', require('./routes/attendance'));
// app.use('/api/payslips', require('./routes/payslip'));
// app.use('/api/announcements', require('./routes/announcements'));
// app.use('/api/profile', require('./routes/profile'));
// app.use('/api/leave', require('./routes/leave'));
// app.use('/api/performance', require('./routes/performance'));
// app.use('/api/helpdesk/admin', require('./routes/helpdeskAdmin'));
// app.use('/api/helpdesk', require('./routes/helpdeskUser'));
// app.use('/api/calendar', require('./routes/calendarAdmin'));
// app.use('/api/calendar', require('./routes/calendarUser'));
// app.use('/api/documents', require('./routes/documents'));
// app.use('/api/expense', require('./routes/Travel&Exprense'));
// app.use('/api/payroll/admin', require('./routes/payrollAdmin'));
// app.use('/api/payroll', require('./routes/payrollUser'));
// app.use('/api/course', require('./routes/CourseRoutes'));

// app.listen(port, '0.0.0.0', (err) => {
//   if (err) { console.log('Server failed to start', err); return; }
//   console.log(`Server running on port ${port}`);
// });