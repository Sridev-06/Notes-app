// Backend entry point for the MyNotes REST API.
// Configures Express middleware, JSON parsing, CORS, and API route groups.
// Connects Mongoose to MongoDB before accepting incoming HTTP requests.
// Starts the server on the configured port and handles basic API errors.const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.get('/', (req, res) => res.json({ message: 'Personal Notes App API is running' }));
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Request body must contain valid JSON' });
  }
  res.status(500).json({ message: 'Server error', error: error.message });
});

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/personal-notes-app';
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Add a long random value to server/.env.');
  process.exit(1);
}
mongoose.connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
