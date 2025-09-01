const express = require('express');
const port = 8015;
const passport = require('./config/passport-jwt');
require('dotenv').config(); 
const cors = require('cors'); 

const app = express();
require('./config/db'); 

app.use(cors());

app.use(cors({
  origin: 'http://localhost:8015', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));

app.listen(port, (err) => {
  if (err) {
    console.log('Server failed to start');
    return;
  }
  console.log('Server running on port: ' + port);
});