const Expense = require('../models/Expense');
const Group = require('../models/Group');


const addExpense = async (req, res) => {
  try {
    const { groupId, description, amount, paidBy, splitAmong } = req.body;

    if (!groupId || !description || !amount || !paidBy || !splitAmong) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }

    if (!Array.isArray(splitAmong) || splitAmong.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one member to split with' });
    }

    
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    const paidByIsMember = group.members.some(m => m.toString() === paidBy);
    if (!paidByIsMember) {
      return res.status(400).json({ success: false, message: 'The payer must be a group member' });
    }

    const expense = await Expense.create({
      groupId,
      description,
      amount: Number(amount),
      paidBy,
      splitAmong,
      createdBy: req.user._id
    });

    const populated = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('splitAmong', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, message: 'Expense added successfully', expense: populated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('Add expense error:', error);
    res.status(500).json({ success: false, message: 'Server error adding expense' });
  }
};


const getGroupExpenses = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const expenses = await Expense.find({ groupId: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splitAmong', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: expenses.length, expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching expenses' });
  }
};


const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (expense.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the expense creator can delete it' });
    }

    await expense.deleteOne();
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting expense' });
  }
};

module.exports = { addExpense, getGroupExpenses, deleteExpense };
