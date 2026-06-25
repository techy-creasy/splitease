const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');


const createGroup = async (req, res) => {
  try {
    const { groupName, description } = req.body;

    if (!groupName) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    const group = await Group.create({
      groupName,
      description: description || '',
      members: [req.user._id],
      createdBy: req.user._id
    });

    const populated = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({ success: true, message: 'Group created successfully', group: populated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Server error creating group' });
  }
};


const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: groups.length, groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching groups' });
  }
};


const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this group.' });
    }

    res.json({ success: true, group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching group' });
  }
};


const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the group creator can delete this group' });
    }

    await Expense.deleteMany({ groupId: group._id });
    await group.deleteOne();

    res.json({ success: true, message: 'Group and all associated expenses deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting group' });
  }
};


const addMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the group creator can add members' });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'No user found with this email address' });
    }

    const alreadyMember = group.members.some(m => m.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      return res.status(409).json({ success: false, message: 'User is already a member of this group' });
    }

    group.members.push(userToAdd._id);
    await group.save();

    const updated = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    res.json({ success: true, message: `${userToAdd.name} added to the group`, group: updated });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Server error adding member' });
  }
};


const removeMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the group creator can remove members' });
    }

    if (req.params.memberId === group.createdBy.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove the group creator' });
    }

    group.members = group.members.filter(m => m.toString() !== req.params.memberId);
    await group.save();

    const updated = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    res.json({ success: true, message: 'Member removed successfully', group: updated });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Server error removing member' });
  }
};

module.exports = { createGroup, getGroups, getGroup, deleteGroup, addMember, removeMember };
