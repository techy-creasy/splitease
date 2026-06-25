const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { getGroupBalanceSummary } = require('../services/balance.service');


const getGroupBalances = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'name email');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const expenses = await Expense.find({ groupId: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splitAmong', 'name email');

    const summary = getGroupBalanceSummary(expenses, group.members);

    res.json({ success: true, groupId: req.params.groupId, ...summary });
  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({ success: false, message: 'Server error calculating balances' });
  }
};

module.exports = { getGroupBalances };
