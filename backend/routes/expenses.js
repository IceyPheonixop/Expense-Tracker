const express = require('express');
const router = express.Router();

const Expense = require('../models/Expense');

/**
 * @route   GET /api/expenses
 * @desc    Get all expenses
 */
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   POST /api/expenses
 * @desc    Add a new expense
 */
router.post('/', async (req, res) => {
  const { description, amount, category } = req.body;

  // Basic validation
  if (!description || !amount || !category) {
    return res.status(400).json({ message: 'Please provide description, amount, and category.' });
  }

  try {
    const newExpense = new Expense({
      description,
      amount,
      category
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(44).json({ message: 'Expense not found.' });
    }

    await expense.deleteOne();

    res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(44).json({ message: 'Expense not found (invalid ID).' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;