const User = require('../models/User');
const PickupRequest = require('../models/PickupRequest');
const Category = require('../models/Category');
const CollectionCentre = require('../models/CollectionCentre');
const Reward = require('../models/Reward');
const { createNotification } = require('../utils/notificationHelper');
const realtimeStream = require('../utils/realtimeStream');

exports.getDashboard = async (req, res) => {
  try {
    const totalRequests = await PickupRequest.countDocuments();
    
    // Total weight collected (Collected or Recycled)
    const collectedAgg = await PickupRequest.aggregate([
      { $match: { status: { $in: ['Collected', 'Recycled'] } } },
      { $group: { _id: null, totalWeight: { $sum: '$approximateWeight' } } }
    ]);
    const totalWeightKg = collectedAgg.length > 0 ? collectedAgg[0].totalWeight : 0;
    const totalWeightTons = (totalWeightKg / 1000).toFixed(2);

    const recycledCount = await PickupRequest.countDocuments({ status: 'Recycled' });
    const agentCount = await User.countDocuments({ role: 'agent' });

    // Recent requests
    const recentRequests = await PickupRequest.find()
      .populate('citizen', 'name email phone')
      .populate('category')
      .populate('agent', 'name')
      .populate('collectionCentre', 'name area')
      .sort({ createdAt: -1 })
      .limit(6);

    // Active Agents & Collection Centres for modal modals
    const agents = await User.find({ role: 'agent' }).sort({ name: 1 });
    const centres = await CollectionCentre.find({ status: 'Active' }).sort({ name: 1 });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard — EcoLoop',
      totalRequests,
      totalWeightKg: totalWeightKg.toFixed(1),
      totalWeightTons,
      recycledCount,
      agentCount,
      recentRequests,
      agents,
      centres
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    req.flash('error_msg', 'Failed to load admin dashboard.');
    res.redirect('/login');
  }
};

exports.getRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status && ['Requested', 'Approved', 'Scheduled', 'Collected', 'Recycled', 'Rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await PickupRequest.find(filter)
      .populate('citizen', 'name email phone address')
      .populate('category')
      .populate('agent', 'name phone')
      .populate('collectionCentre', 'name area')
      .sort({ createdAt: -1 });

    const agents = await User.find({ role: 'agent' }).sort({ name: 1 });
    const centres = await CollectionCentre.find({ status: 'Active' }).sort({ name: 1 });

    res.render('admin/requests', {
      title: 'Pickup Requests Management — EcoLoop',
      requests,
      agents,
      centres,
      selectedStatus: status || 'all'
    });
  } catch (error) {
    console.error('Admin Requests Error:', error);
    req.flash('error_msg', 'Failed to fetch pickup requests.');
    res.redirect('/admin/dashboard');
  }
};

exports.postApproveRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await PickupRequest.findById(requestId);
    if (!request) {
      req.flash('error_msg', 'Request not found.');
      return res.redirect('/admin/requests');
    }

    request.status = 'Approved';
    await request.save();

    realtimeStream.broadcast('pickup_status_updated', {
      pickupId: request._id.toString(),
      status: 'Approved'
    });

    await createNotification({
      userId: request.citizen,
      title: 'Pickup Request Approved',
      message: `Your pickup request #${request._id.toString().slice(-6).toUpperCase()} has been approved by EcoLoop Admin.`,
      type: 'success',
      link: `/citizen/pickup/${request._id}`
    });

    req.flash('success_msg', 'Pickup request approved successfully!');
    res.redirect('/admin/requests');
  } catch (error) {
    console.error('Approve Request Error:', error);
    req.flash('error_msg', 'Failed to approve request.');
    res.redirect('/admin/requests');
  }
};

exports.postRejectRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const { rejectionReason } = req.body;

    const request = await PickupRequest.findById(requestId);
    if (!request) {
      req.flash('error_msg', 'Request not found.');
      return res.redirect('/admin/requests');
    }

    request.status = 'Rejected';
    request.rejectionReason = rejectionReason || 'Does not meet collection guidelines.';
    await request.save();

    await createNotification({
      userId: request.citizen,
      title: 'Pickup Request Rejected',
      message: `Your pickup request #${request._id.toString().slice(-6).toUpperCase()} was rejected: ${request.rejectionReason}`,
      type: 'warning',
      link: `/citizen/pickup/${request._id}`
    });

    req.flash('success_msg', 'Pickup request rejected.');
    res.redirect('/admin/requests');
  } catch (error) {
    console.error('Reject Request Error:', error);
    req.flash('error_msg', 'Failed to reject request.');
    res.redirect('/admin/requests');
  }
};

exports.postAssignRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const { agentId, centreId } = req.body;

    if (!agentId || !centreId) {
      req.flash('error_msg', 'Please select both a Collection Agent and a Collection Centre.');
      return res.redirect('/admin/requests');
    }

    const request = await PickupRequest.findById(requestId);
    if (!request) {
      req.flash('error_msg', 'Request not found.');
      return res.redirect('/admin/requests');
    }

    request.agent = agentId;
    request.collectionCentre = centreId;
    request.status = 'Scheduled';

    await request.save();

    realtimeStream.broadcast('pickup_status_updated', {
      pickupId: request._id.toString(),
      status: 'Scheduled'
    });

    await createNotification({
      userId: request.citizen,
      title: 'Agent Assigned & Scheduled',
      message: `An agent has been assigned to pickup #${request._id.toString().slice(-6).toUpperCase()}.`,
      type: 'info',
      link: `/citizen/pickup/${request._id}`
    });

    await createNotification({
      userId: agentId,
      title: 'New Pickup Assigned',
      message: `You have been assigned to pickup #${request._id.toString().slice(-6).toUpperCase()}.`,
      type: 'info',
      link: `/agent/pickup/${request._id}`
    });

    req.flash('success_msg', 'Collection agent & centre assigned! Request status set to SCHEDULED.');
    res.redirect('/admin/requests');
  } catch (error) {
    console.error('Assign Request Error:', error);
    req.flash('error_msg', 'Failed to assign agent to pickup request.');
    res.redirect('/admin/requests');
  }
};

exports.postUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.id;

    const validStatuses = ['Requested', 'Approved', 'Scheduled', 'Collected', 'Recycled', 'Rejected'];
    if (!validStatuses.includes(status)) {
      req.flash('error_msg', 'Invalid status update option.');
      return res.redirect('/admin/requests');
    }

    const request = await PickupRequest.findById(requestId).populate('category');
    if (!request) {
      req.flash('error_msg', 'Pickup request not found.');
      return res.redirect('/admin/requests');
    }

    const previousStatus = request.status;
    request.status = status;

    if (status === 'Recycled' && previousStatus !== 'Recycled') {
      const existingReward = await Reward.findOne({ pickup: request._id });
      if (!existingReward) {
        const rewardPointsPerKg = request.category ? request.category.rewardPointsPerKg : 50;
        const pricePerKg = request.category ? (request.category.pricePerKg || 15) : 15;

        const calculatedPoints = Math.round(request.approximateWeight * rewardPointsPerKg);
        const calculatedCash = Number((request.approximateWeight * pricePerKg).toFixed(2));

        request.rewardPointsEarned = calculatedPoints;
        request.cashRewardEarned = calculatedCash;

        const newReward = new Reward({
          citizen: request.citizen,
          pickup: request._id,
          points: calculatedPoints,
          cashAmount: calculatedCash,
          type: 'Earned',
          description: `Recycled ${request.category ? request.category.name : 'E-Waste'} (${request.approximateWeight} KG)`
        });

        await newReward.save();

        await createNotification({
          userId: request.citizen,
          title: `+${calculatedPoints} Eco Points & ₹${calculatedCash} Earned!`,
          message: `E-waste recycling completed for #${request._id.toString().slice(-6).toUpperCase()}. Rewards added to your Eco Wallet!`,
          type: 'reward',
          link: '/citizen/wallet'
        });

        req.flash('success_msg', `Status updated to RECYCLED! Awarded ${calculatedPoints} Eco Points & ₹${calculatedCash} Money Reward to citizen.`);
      } else {
        req.flash('success_msg', 'Status updated to RECYCLED!');
      }
    } else {
      await createNotification({
        userId: request.citizen,
        title: `Pickup Status: ${status}`,
        message: `Pickup #${request._id.toString().slice(-6).toUpperCase()} status updated to ${status}.`,
        type: 'info',
        link: `/citizen/pickup/${request._id}`
      });

      req.flash('success_msg', `Request status updated to ${status}.`);
    }

    await request.save();
    res.redirect('/admin/requests');
  } catch (error) {
    console.error('Admin Update Status Error:', error);
    req.flash('error_msg', 'Failed to update request status.');
    res.redirect('/admin/requests');
  }
};

exports.getAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' }).sort({ createdAt: -1 });

    // Attach assigned pickup counts for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const assignedCount = await PickupRequest.countDocuments({ agent: agent._id });
        const completedCount = await PickupRequest.countDocuments({ agent: agent._id, status: 'Recycled' });
        return {
          ...agent.toObject(),
          assignedCount,
          completedCount
        };
      })
    );

    res.render('admin/agents', {
      title: 'Collection Agents — EcoLoop',
      agents: agentsWithStats
    });
  } catch (error) {
    console.error('Admin Get Agents Error:', error);
    req.flash('error_msg', 'Failed to load agents list.');
    res.redirect('/admin/dashboard');
  }
};

exports.postCreateAgent = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      req.flash('error_msg', 'Name, Email, and Password are required.');
      return res.redirect('/admin/agents');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error_msg', 'A user with this email already exists.');
      return res.redirect('/admin/agents');
    }

    const newAgent = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: 'agent',
      phone: phone || '',
      address: address || ''
    });

    await newAgent.save();

    req.flash('success_msg', `Collection agent ${name} registered successfully!`);
    res.redirect('/admin/agents');
  } catch (error) {
    console.error('Create Agent Error:', error);
    req.flash('error_msg', 'Failed to create collection agent.');
    res.redirect('/admin/agents');
  }
};

exports.getCentres = async (req, res) => {
  try {
    const centres = await CollectionCentre.find().sort({ createdAt: -1 });
    res.render('admin/centres', {
      title: 'Collection Centres — EcoLoop',
      centres
    });
  } catch (error) {
    console.error('Get Centres Error:', error);
    req.flash('error_msg', 'Failed to load collection centres.');
    res.redirect('/admin/dashboard');
  }
};

exports.postCreateCentre = async (req, res) => {
  try {
    const { name, address, area, contact, status } = req.body;

    if (!name || !address || !area || !contact) {
      req.flash('error_msg', 'All fields are required to create a collection centre.');
      return res.redirect('/admin/centres');
    }

    const newCentre = new CollectionCentre({
      name,
      address,
      area,
      contact,
      status: status || 'Active'
    });

    await newCentre.save();

    req.flash('success_msg', `Collection Centre '${name}' created successfully!`);
    res.redirect('/admin/centres');
  } catch (error) {
    console.error('Create Centre Error:', error);
    req.flash('error_msg', 'Failed to create collection centre.');
    res.redirect('/admin/centres');
  }
};

exports.postEditCentre = async (req, res) => {
  try {
    const { name, address, area, contact, status } = req.body;
    const centreId = req.params.id;

    await CollectionCentre.findByIdAndUpdate(centreId, {
      name,
      address,
      area,
      contact,
      status
    });

    req.flash('success_msg', 'Collection Centre updated successfully!');
    res.redirect('/admin/centres');
  } catch (error) {
    console.error('Edit Centre Error:', error);
    req.flash('error_msg', 'Failed to update collection centre.');
    res.redirect('/admin/centres');
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.render('admin/categories', {
      title: 'E-Waste Categories — EcoLoop',
      categories
    });
  } catch (error) {
    console.error('Get Categories Error:', error);
    req.flash('error_msg', 'Failed to load categories.');
    res.redirect('/admin/dashboard');
  }
};

exports.postCreateCategory = async (req, res) => {
  try {
    const { name, description, rewardPointsPerKg, pricePerKg, icon } = req.body;

    if (!name || !rewardPointsPerKg) {
      req.flash('error_msg', 'Category Name and Reward Points per KG are required.');
      return res.redirect('/admin/categories');
    }

    const newCat = new Category({
      name,
      description: description || '',
      rewardPointsPerKg: Number(rewardPointsPerKg),
      pricePerKg: Number(pricePerKg || 15),
      icon: icon || '📱'
    });

    await newCat.save();

    req.flash('success_msg', `Category '${name}' created successfully!`);
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Create Category Error:', error);
    req.flash('error_msg', 'Failed to create category.');
    res.redirect('/admin/categories');
  }
};

exports.postEditCategory = async (req, res) => {
  try {
    const { name, description, rewardPointsPerKg, pricePerKg, icon } = req.body;
    const catId = req.params.id;

    await Category.findByIdAndUpdate(catId, {
      name,
      description,
      rewardPointsPerKg: Number(rewardPointsPerKg),
      pricePerKg: Number(pricePerKg || 15),
      icon
    });

    req.flash('success_msg', 'Category rates & details updated successfully!');
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Edit Category Error:', error);
    req.flash('error_msg', 'Failed to update category.');
    res.redirect('/admin/categories');
  }
};

exports.getStatistics = async (req, res) => {
  try {
    // 1. Overall stats
    const totalRequests = await PickupRequest.countDocuments();
    
    const weightAgg = await PickupRequest.aggregate([
      { $match: { status: { $in: ['Collected', 'Recycled'] } } },
      { $group: { _id: null, totalWeight: { $sum: '$approximateWeight' } } }
    ]);
    const totalWeightCollected = weightAgg.length > 0 ? weightAgg[0].totalWeight : 0;

    // 2. Category-wise breakdown
    const categoryStats = await PickupRequest.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'catInfo'
        }
      },
      { $unwind: '$catInfo' },
      {
        $group: {
          _id: '$catInfo.name',
          icon: { $first: '$catInfo.icon' },
          count: { $sum: 1 },
          totalWeight: { $sum: '$approximateWeight' }
        }
      },
      { $sort: { totalWeight: -1 } }
    ]);

    // 3. Area breakdown (from address / collection centres)
    const areaStats = await PickupRequest.aggregate([
      {
        $lookup: {
          from: 'collectioncentres',
          localField: 'collectionCentre',
          foreignField: '_id',
          as: 'centreInfo'
        }
      },
      {
        $project: {
          areaName: {
            $cond: {
              if: { $gt: [{ $size: '$centreInfo' }, 0] },
              then: { $arrayElemAt: ['$centreInfo.area', 0] },
              else: 'General City Area'
            }
          },
          approximateWeight: '$approximateWeight',
          status: '$status'
        }
      },
      {
        $group: {
          _id: '$areaName',
          count: { $sum: 1 },
          totalWeight: { $sum: '$approximateWeight' }
        }
      },
      { $sort: { totalWeight: -1 } }
    ]);

    // 4. Status breakdown counts
    const statusCounts = {
      Requested: await PickupRequest.countDocuments({ status: 'Requested' }),
      Approved: await PickupRequest.countDocuments({ status: 'Approved' }),
      Scheduled: await PickupRequest.countDocuments({ status: 'Scheduled' }),
      Collected: await PickupRequest.countDocuments({ status: 'Collected' }),
      Recycled: await PickupRequest.countDocuments({ status: 'Recycled' }),
      Rejected: await PickupRequest.countDocuments({ status: 'Rejected' })
    };

    res.render('admin/statistics', {
      title: 'Recycling Statistics & Analytics — EcoLoop',
      totalRequests,
      totalWeightCollected: totalWeightCollected.toFixed(1),
      categoryStats,
      areaStats,
      statusCounts
    });
  } catch (error) {
    console.error('Get Statistics Error:', error);
    req.flash('error_msg', 'Failed to load statistics.');
    res.redirect('/admin/dashboard');
  }
};
