const PickupRequest = require('../models/PickupRequest');
const Category = require('../models/Category');
const Reward = require('../models/Reward');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // 1. Basic Stats
    const totalRequests = await PickupRequest.countDocuments({ citizen: userId });
    
    const collectedAgg = await PickupRequest.aggregate([
      { $match: { citizen: userId, status: { $in: ['Collected', 'Recycled'] } } },
      { $group: { _id: null, totalWeight: { $sum: '$approximateWeight' } } }
    ]);
    const totalCollectedWeight = collectedAgg.length > 0 ? collectedAgg[0].totalWeight : 0;

    const rewardEarnedAgg = await Reward.aggregate([
      { $match: { citizen: userId, type: 'Earned' } },
      { $group: { _id: null, total: { $sum: '$points' }, totalCash: { $sum: '$cashAmount' } } }
    ]);
    const rewardRedeemedAgg = await Reward.aggregate([
      { $match: { citizen: userId, type: 'Redeemed' } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    const totalEarned = rewardEarnedAgg.length > 0 ? rewardEarnedAgg[0].total : 0;
    const totalCashEarned = rewardEarnedAgg.length > 0 ? (rewardEarnedAgg[0].totalCash || 0) : 0;
    const totalRedeemed = rewardRedeemedAgg.length > 0 ? rewardRedeemedAgg[0].total : 0;
    const walletBalance = totalEarned - totalRedeemed;

    // 2. Month-by-Month Breakdown (This Month vs Last Month vs Total)
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const thisMonthAgg = await PickupRequest.aggregate([
      { $match: { citizen: userId, status: { $in: ['Collected', 'Recycled'] }, createdAt: { $gte: startOfThisMonth } } },
      { $group: { _id: null, total: { $sum: '$approximateWeight' } } }
    ]);
    const thisMonthWeight = thisMonthAgg.length > 0 ? thisMonthAgg[0].total : 0;

    const lastMonthAgg = await PickupRequest.aggregate([
      { $match: { citizen: userId, status: { $in: ['Collected', 'Recycled'] }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$approximateWeight' } } }
    ]);
    const lastMonthWeight = lastMonthAgg.length > 0 ? lastMonthAgg[0].total : 0;

    // 3. Category Breakdown for Logged-In Citizen
    const citizenCategoryAgg = await PickupRequest.aggregate([
      { $match: { citizen: userId, status: { $in: ['Collected', 'Recycled'] } } },
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
          weight: { $sum: '$approximateWeight' }
        }
      },
      { $sort: { weight: -1 } }
    ]);

    // 4. Eco Rank & Percentile Calculation in City (Ghaziabad / Area)
    const allCitizens = await User.find({ role: 'citizen' });
    const citizenRankings = await Promise.all(
      allCitizens.map(async (c) => {
        const wAgg = await PickupRequest.aggregate([
          { $match: { citizen: c._id, status: { $in: ['Collected', 'Recycled'] } } },
          { $group: { _id: null, total: { $sum: '$approximateWeight' } } }
        ]);
        const weight = wAgg.length > 0 ? wAgg[0].total : 0;
        return { userId: c._id.toString(), name: c.name, weight };
      })
    );

    // Sort descending by weight
    citizenRankings.sort((a, b) => b.weight - a.weight);

    const userIndex = citizenRankings.findIndex((item) => item.userId === userId.toString());
    const ecoRank = userIndex !== -1 ? userIndex + 1 : citizenRankings.length;
    const totalUsers = citizenRankings.length || 1;
    const percentile = Math.min(98, Math.max(50, Math.round(((totalUsers - ecoRank + 1) / totalUsers) * 100)));

    // 5. Achievements Badges Logic
    const hasBattery = citizenCategoryAgg.some((c) => c._id.toLowerCase().includes('battery'));
    const achievements = [
      { id: 'first_pickup', title: 'First Pickup', icon: '🥇', description: 'Created your 1st e-waste request', earned: totalRequests >= 1 },
      { id: 'recycler_10kg', title: '10 KG Recycler', icon: '♻️', description: 'Recycled 10+ KG of e-waste', earned: totalCollectedWeight >= 10 },
      { id: 'battery_saver', title: 'Battery Saver', icon: '🔋', description: 'Safely recycled toxic batteries', earned: hasBattery },
      { id: 'green_citizen', title: 'Green Citizen', icon: '🌱', description: 'Recycled 25+ KG of e-waste', earned: totalCollectedWeight >= 25 },
      { id: 'eco_champion', title: 'Eco Champion', icon: '🏆', description: 'Recycled 50+ KG or top rank', earned: totalCollectedWeight >= 50 || ecoRank <= 3 }
    ];

    // Upcoming active pickup
    const upcomingPickup = await PickupRequest.findOne({
      citizen: userId,
      status: { $in: ['Requested', 'Approved', 'Scheduled', 'Collected'] }
    })
      .populate('category')
      .sort({ createdAt: -1 });

    // Recent 5 pickups
    const recentPickups = await PickupRequest.find({ citizen: userId })
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(5);

    const co2Saved = (totalCollectedWeight * 0.256).toFixed(1);
    const treesEquivalent = Math.round(totalCollectedWeight / 4.0) || 12;

    res.render('citizen/dashboard', {
      title: 'Citizen Dashboard — EcoLoop',
      totalRequests,
      totalCollectedWeight: totalCollectedWeight.toFixed(1),
      co2Saved,
      treesEquivalent,
      walletBalance,
      totalEarned,
      totalRedeemed,
      totalCashEarned: totalCashEarned.toFixed(2),
      thisMonthWeight: thisMonthWeight.toFixed(1),
      lastMonthWeight: lastMonthWeight.toFixed(1),
      citizenCategoryAgg,
      ecoRank,
      percentile,
      achievements,
      upcomingPickup,
      recentPickups
    });
  } catch (error) {
    console.error('Citizen Dashboard Error:', error);
    req.flash('error_msg', 'Failed to load dashboard data.');
    res.redirect('/login');
  }
};

exports.getNewPickup = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.render('citizen/newPickup', {
      title: 'Schedule E-Waste Pickup — EcoLoop',
      categories,
      userAddress: req.session.user.address || ''
    });
  } catch (error) {
    console.error('New Pickup Error:', error);
    req.flash('error_msg', 'Failed to load pickup categories.');
    res.redirect('/citizen/dashboard');
  }
};

exports.postNewPickup = async (req, res) => {
  try {
    const { categoryId, quantity, approximateWeight, address, preferredDate } = req.body;

    if (!categoryId || !quantity || !approximateWeight || !address || !preferredDate) {
      req.flash('error_msg', 'Please complete all required pickup form fields.');
      return res.redirect('/citizen/pickup/new');
    }

    const newPickup = new PickupRequest({
      citizen: req.session.user._id,
      category: categoryId,
      quantity: Number(quantity),
      approximateWeight: Number(approximateWeight),
      address: address.trim(),
      preferredDate: new Date(preferredDate),
      status: 'Requested'
    });

    await newPickup.save();

    await createNotification({
      userId: req.session.user._id,
      title: 'Pickup Request Submitted',
      message: `Your e-waste pickup request for ${approximateWeight} KG has been created (#${newPickup._id.toString().slice(-6).toUpperCase()}).`,
      type: 'info',
      link: `/citizen/pickup/${newPickup._id}`
    });

    req.flash('success_msg', 'Pickup request submitted successfully! Admin will review and schedule an agent soon.');
    res.redirect('/citizen/pickups');
  } catch (error) {
    console.error('Submit Pickup Error:', error);
    req.flash('error_msg', 'Failed to submit pickup request.');
    res.redirect('/citizen/pickup/new');
  }
};

exports.getPickups = async (req, res) => {
  try {
    const pickups = await PickupRequest.find({ citizen: req.session.user._id })
      .populate('category')
      .populate('agent', 'name phone')
      .populate('collectionCentre', 'name area')
      .sort({ createdAt: -1 });

    res.render('citizen/pickups', {
      title: 'My Pickups — EcoLoop',
      pickups
    });
  } catch (error) {
    console.error('Get Pickups Error:', error);
    req.flash('error_msg', 'Failed to fetch pickup requests.');
    res.redirect('/citizen/dashboard');
  }
};

exports.getPickupDetail = async (req, res) => {
  try {
    const pickup = await PickupRequest.findOne({
      _id: req.params.id,
      citizen: req.session.user._id
    })
      .populate('category')
      .populate('agent', 'name phone email')
      .populate('collectionCentre');

    if (!pickup) {
      req.flash('error_msg', 'Pickup request not found.');
      return res.redirect('/citizen/pickups');
    }

    res.render('citizen/pickupDetail', {
      title: `Pickup #${pickup._id.toString().slice(-6).toUpperCase()} — EcoLoop`,
      pickup
    });
  } catch (error) {
    console.error('Get Pickup Detail Error:', error);
    req.flash('error_msg', 'Invalid pickup request ID.');
    res.redirect('/citizen/pickups');
  }
};

exports.getWallet = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const rewards = await Reward.find({ citizen: userId })
      .populate('pickup')
      .sort({ createdAt: -1 });

    const totalEarned = rewards
      .filter((r) => r.type === 'Earned')
      .reduce((sum, r) => sum + r.points, 0);

    const totalCashEarned = rewards
      .filter((r) => r.type === 'Earned')
      .reduce((sum, r) => sum + (r.cashAmount || 0), 0);

    const totalRedeemed = rewards
      .filter((r) => r.type === 'Redeemed')
      .reduce((sum, r) => sum + r.points, 0);

    const balance = totalEarned - totalRedeemed;

    res.render('citizen/wallet', {
      title: 'My Eco Wallet — EcoLoop',
      rewards,
      totalEarned,
      totalCashEarned: totalCashEarned.toFixed(2),
      totalRedeemed,
      balance
    });
  } catch (error) {
    console.error('Get Wallet Error:', error);
    req.flash('error_msg', 'Failed to load reward wallet data.');
    res.redirect('/citizen/dashboard');
  }
};

exports.postRedeemPoints = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { points, description } = req.body;

    const pointsToRedeem = Number(points);
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      req.flash('error_msg', 'Invalid redemption points amount.');
      return res.redirect('/citizen/wallet');
    }

    const rewards = await Reward.find({ citizen: userId });
    const totalEarned = rewards.filter((r) => r.type === 'Earned').reduce((sum, r) => sum + r.points, 0);
    const totalRedeemed = rewards.filter((r) => r.type === 'Redeemed').reduce((sum, r) => sum + r.points, 0);
    const currentBalance = totalEarned - totalRedeemed;

    if (currentBalance < pointsToRedeem) {
      req.flash('error_msg', `Insufficient Eco Points balance! Available balance is ${currentBalance} points.`);
      return res.redirect('/citizen/wallet');
    }

    const redemptionReward = new Reward({
      citizen: userId,
      points: pointsToRedeem,
      cashAmount: 0,
      type: 'Redeemed',
      description: description || `Redeemed Eco Voucher (${pointsToRedeem} Pts)`
    });

    await redemptionReward.save();

    req.flash('success_msg', `🎉 Successfully redeemed ${pointsToRedeem} Eco Points for ${description || 'Eco Voucher'}!`);
    res.redirect('/citizen/wallet');
  } catch (error) {
    console.error('Redeem Points Error:', error);
    req.flash('error_msg', 'Failed to process points redemption.');
    res.redirect('/citizen/wallet');
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const allCitizens = await User.find({ role: 'citizen' });
    const rankings = await Promise.all(
      allCitizens.map(async (c) => {
        const wAgg = await PickupRequest.aggregate([
          { $match: { citizen: c._id, status: { $in: ['Collected', 'Recycled'] } } },
          { $group: { _id: null, totalWeight: { $sum: '$approximateWeight' }, totalPickups: { $sum: 1 } } }
        ]);
        const pAgg = await Reward.aggregate([
          { $match: { citizen: c._id, type: 'Earned' } },
          { $group: { _id: null, totalPoints: { $sum: '$points' } } }
        ]);

        return {
          userId: c._id.toString(),
          name: c.name,
          email: c.email,
          address: c.address || 'Ghaziabad',
          totalWeight: wAgg.length > 0 ? wAgg[0].totalWeight : 0,
          totalPickups: wAgg.length > 0 ? wAgg[0].totalPickups : 0,
          totalPoints: pAgg.length > 0 ? pAgg[0].totalPoints : 0
        };
      })
    );

    rankings.sort((a, b) => b.totalWeight - a.totalWeight);

    const userRankIndex = rankings.findIndex((r) => r.userId === userId.toString());
    const userRank = userRankIndex !== -1 ? userRankIndex + 1 : rankings.length;

    res.render('citizen/leaderboard', {
      title: 'City Eco Leaderboard — EcoLoop',
      rankings,
      userRank
    });
  } catch (error) {
    console.error('Get Leaderboard Error:', error);
    req.flash('error_msg', 'Failed to load leaderboard.');
    res.redirect('/citizen/dashboard');
  }
};
