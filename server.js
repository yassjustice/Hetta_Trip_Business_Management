const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/triptex')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/upload', require('./routes/upload'));

// Development seed route
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/seed', require('./routes/seed'));
}

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  // Catch all handler: send back React's index.html file for any non-API routes
  app.get('*', (req, res) => {
    // Only serve React app for non-API routes
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    } else {
      res.status(404).json({ message: 'API route not found' });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler for API routes only (non-API routes handled above in production)
if (process.env.NODE_ENV !== 'production') {
  app.all('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
