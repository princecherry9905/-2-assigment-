const mongoose = require('mongoose');

const pickupRequestSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  approximateWeight: {
    type: Number,
    required: [true, 'Approximate weight is required'],
    min: [0.1, 'Weight must be at least 0.1 KG']
  },
  address: {
    type: String,
    required: [true, 'Pickup address is required'],
    trim: true
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred pickup date is required']
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  collectionCentre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionCentre',
    default: null
  },
  status: {
    type: String,
    enum: ['Requested', 'Approved', 'Scheduled', 'Collected', 'At Centre', 'Sorting', 'Recycling', 'Recycled', 'Rejected'],
    default: 'Requested'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  rewardPointsEarned: {
    type: Number,
    default: 0
  },
  cashRewardEarned: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PickupRequest', pickupRequestSchema);
