require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

mongoose.connect(dbURI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/expenses', require('./routes/expenses'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Expense Tracker API is running smoothly.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});