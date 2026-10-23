// This file configures the Express API, connects MongoDB, and starts the backend server.
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
// Allow requests from the frontend and parse incoming JSON request bodies.
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
// Keep account endpoints public and apply authentication inside the notes router.
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
// Provide a simple endpoint to confirm that the backend process is responding.
app.get('/', (req, res) => res.json({ message: 'Personal Notes App API is running' }));
// Return JSON for unknown routes instead of an HTML error page.
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
// Convert malformed JSON and unexpected errors into consistent JSON responses.
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Request body must contain valid JSON' });
  }
  res.status(500).json({ message: 'Server error', error: error.message });
});

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/personal-notes-app';
// Refuse to start with an unsigned or predictable fallback JWT secret.
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Add a long random value to server/.env.');
  process.exit(1);
}
// Connect to MongoDB first, then begin accepting API requests.
mongoose.connect(mongoUri)
  // Start the HTTP server only after the database connection is ready.
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
  })
  // Stop the process when MongoDB cannot be reached during startup.
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
