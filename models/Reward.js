const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PickupRequest',
    default: null
  },
  points: {
    type: Number,
    required: true,
    default: 0
  },
  cashAmount: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['Earned', 'Redeemed'],
    default: 'Earned'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reward', rewardSchema);
