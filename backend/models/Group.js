const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [2, 'Group name must be at least 2 characters'],
    maxlength: [50, 'Group name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure creator is always in members
groupSchema.pre('save', function(next) {
  if (!this.members.includes(this.createdBy)) {
    this.members.unshift(this.createdBy);
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
