const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  rewardPointsPerKg: {
    type: Number,
    required: [true, 'Reward points per KG is required'],
    min: 0,
    default: 50
  },
  pricePerKg: {
    type: Number,
    required: [true, 'Cash rate per KG is required'],
    min: 0,
    default: 15
  },
  icon: {
    type: String,
    default: '📱'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', categorySchema);
