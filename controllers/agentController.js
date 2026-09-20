const PickupRequest = require('../models/PickupRequest');
const Category = require('../models/Category');
const Reward = require('../models/Reward');
const realtimeStream = require('../utils/realtimeStream');

exports.getDashboard = async (req, res) => {
  try {
    const agentId = req.session.user._id;

    const assignedCount = await PickupRequest.countDocuments({ agent: agentId });
    const scheduledCount = await PickupRequest.countDocuments({ agent: agentId, status: 'Scheduled' });
    const collectedCount = await PickupRequest.countDocuments({ agent: agentId, status: 'Collected' });
    const recycledCount = await PickupRequest.countDocuments({ agent: agentId, status: 'Recycled' });

    // Today's assigned pickups
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysPickups = await PickupRequest.find({
      agent: agentId,
      preferredDate: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('citizen', 'name phone address')
      .populate('category')
      .populate('collectionCentre', 'name area')
      .sort({ createdAt: -1 });

    const recentAssigned = await PickupRequest.find({ agent: agentId })
      .populate('citizen', 'name phone address')
      .populate('category')
      .populate('collectionCentre', 'name area')
      .sort({ createdAt: -1 })
      .limit(6);

    res.render('agent/dashboard', {
      title: 'Agent Dashboard — EcoLoop',
      assignedCount,
      scheduledCount,
      collectedCount,
      recycledCount,
      todaysPickups,
      recentAssigned
    });
  } catch (error) {
    console.error('Agent Dashboard Error:', error);
    req.flash('error_msg', 'Failed to load agent dashboard.');
    res.redirect('/login');
  }
};

exports.getPickups = async (req, res) => {
  try {
    const agentId = req.session.user._id;
    const { status } = req.query;

    let query = { agent: agentId };
    if (status && ['Scheduled', 'Collected', 'Recycled'].includes(status)) {
      query.status = status;
    }

    const pickups = await PickupRequest.find(query)
      .populate('citizen', 'name phone address email')
      .populate('category')
      .populate('collectionCentre', 'name address area')
      .sort({ createdAt: -1 });

    res.render('agent/pickups', {
      title: 'Assigned Pickups — EcoLoop',
      pickups,
      selectedStatus: status || 'all'
    });
  } catch (error) {
    console.error('Agent Get Pickups Error:', error);
    req.flash('error_msg', 'Failed to fetch assigned pickups.');
    res.redirect('/agent/dashboard');
  }
};

exports.getPickupDetail = async (req, res) => {
  try {
    const agentId = req.session.user._id;

    const pickup = await PickupRequest.findOne({
      _id: req.params.id,
      agent: agentId
    })
      .populate('citizen', 'name phone email address')
      .populate('category')
      .populate('collectionCentre');

    if (!pickup) {
      req.flash('error_msg', 'Pickup request not found or not assigned to you.');
      return res.redirect('/agent/pickups');
    }

    res.render('agent/pickupDetail', {
      title: `Agent Pickup #${pickup._id.toString().slice(-6).toUpperCase()} — EcoLoop`,
      pickup
    });
  } catch (error) {
    console.error('Agent Pickup Detail Error:', error);
    req.flash('error_msg', 'Invalid pickup ID.');
    res.redirect('/agent/pickups');
  }
};

exports.postUpdateStatus = async (req, res) => {
  try {
    const agentId = req.session.user._id;
    const { status } = req.body;
    const pickupId = req.params.id;

    const validStatuses = ['Scheduled', 'Collected', 'At Centre', 'Sorting', 'Recycling', 'Recycled'];
    if (!validStatuses.includes(status)) {
      req.flash('error_msg', 'Invalid status update option.');
      return res.redirect(`/agent/pickup/${pickupId}`);
    }

    const pickup = await PickupRequest.findOne({ _id: pickupId, agent: agentId }).populate('category');
    if (!pickup) {
      req.flash('error_msg', 'Pickup request not found.');
      return res.redirect('/agent/pickups');
    }

    const previousStatus = pickup.status;
    pickup.status = status;

    // Handle reward calculation when reaching 'Recycled' status
    if (status === 'Recycled' && previousStatus !== 'Recycled') {
      // Prevent duplicate reward entry
      const existingReward = await Reward.findOne({ pickup: pickup._id });
      if (!existingReward) {
        const rewardPointsPerKg = pickup.category ? pickup.category.rewardPointsPerKg : 50;
        const pricePerKg = pickup.category ? (pickup.category.pricePerKg || 15) : 15;

        const calculatedPoints = Math.round(pickup.approximateWeight * rewardPointsPerKg);
        const calculatedCash = Number((pickup.approximateWeight * pricePerKg).toFixed(2));

        pickup.rewardPointsEarned = calculatedPoints;
        pickup.cashRewardEarned = calculatedCash;

        const newReward = new Reward({
          citizen: pickup.citizen,
          pickup: pickup._id,
          points: calculatedPoints,
          cashAmount: calculatedCash,
          type: 'Earned',
          description: `Recycled ${pickup.category ? pickup.category.name : 'E-Waste'} (${pickup.approximateWeight} KG)`
        });

        await newReward.save();
        req.flash('success_msg', `Status updated to RECYCLED! Awarded ${calculatedPoints} Eco Points & ₹${calculatedCash} Money Reward to citizen.`);
      } else {
        req.flash('success_msg', 'Status updated to RECYCLED!');
      }
    } else {
      req.flash('success_msg', `Pickup status updated to ${status}.`);
    }

    await pickup.save();

    realtimeStream.broadcast('pickup_status_updated', {
      pickupId: pickup._id.toString(),
      status: pickup.status,
      points: pickup.rewardPointsEarned,
      cash: pickup.cashRewardEarned,
      updatedAt: new Date()
    });

    res.redirect(`/agent/pickup/${pickupId}`);
  } catch (error) {
    console.error('Agent Update Status Error:', error);
    req.flash('error_msg', 'Failed to update pickup status.');
    res.redirect('/agent/pickups');
  }
};
