require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Category = require('./models/Category');
const CollectionCentre = require('./models/CollectionCentre');
const PickupRequest = require('./models/PickupRequest');
const Reward = require('./models/Reward');
const Notification = require('./models/Notification');

const seedData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing database collections...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await CollectionCentre.deleteMany({});
    await PickupRequest.deleteMany({});
    await Reward.deleteMany({});
    await Notification.deleteMany({});

    console.log('🌱 Seeding E-Waste Categories...');
    const categories = await Category.insertMany([
      {
        name: 'Mobiles',
        description: 'Smartphones, feature phones, tablets, and mobile accessories.',
        rewardPointsPerKg: 100,
        pricePerKg: 50,
        icon: '📱'
      },
      {
        name: 'Batteries',
        description: 'Lithium-ion batteries, laptop batteries, power banks, and dry cells.',
        rewardPointsPerKg: 80,
        pricePerKg: 30,
        icon: '🔋'
      },
      {
        name: 'Appliances',
        description: 'Microwaves, refrigerators, washing machines, and household electronics.',
        rewardPointsPerKg: 50,
        pricePerKg: 20,
        icon: '🏠'
      },
      {
        name: 'Cables',
        description: 'Power cables, USB chargers, copper wiring, and adapter cords.',
        rewardPointsPerKg: 40,
        pricePerKg: 15,
        icon: '🔌'
      }
    ]);

    console.log('🌱 Seeding Collection Centres...');
    const centres = await CollectionCentre.insertMany([
      {
        name: 'Green Recycling Centre',
        address: 'Plot 45, Raj Nagar Industrial Area',
        area: 'Ghaziabad',
        contact: '+91 120 4567890',
        status: 'Active'
      },
      {
        name: 'EcoHub Noida',
        address: 'Sector 63, Block B, Tech Zone',
        area: 'Noida',
        contact: '+91 120 9876543',
        status: 'Active'
      },
      {
        name: 'City Recycling Delhi',
        address: 'Okhla Industrial Estate Phase III',
        area: 'Delhi',
        contact: '+91 11 23456789',
        status: 'Active'
      }
    ]);

    console.log('🌱 Seeding Users (Admin, Agent, Citizen)...');
    const adminUser = new User({
      name: 'Admin Recycler',
      email: 'admin@ecoloop.com',
      password: 'password123',
      role: 'admin',
      phone: '+91 9999900000',
      address: 'EcoLoop HQ, Delhi NCR'
    });
    await adminUser.save();

    const agentUser = new User({
      name: 'Ramesh Agent',
      email: 'agent@ecoloop.com',
      password: 'password123',
      role: 'agent',
      phone: '+91 9876500000',
      address: 'Ghaziabad Sector 10'
    });
    await agentUser.save();

    const citizenUser = new User({
      name: 'Prince Kumar',
      email: 'prince@ecoloop.com',
      password: 'password123',
      role: 'citizen',
      phone: '+91 9123456789',
      address: 'Flat 302, Green Park Apartments, Ghaziabad'
    });
    await citizenUser.save();

    console.log('🌱 Seeding Sample Pickup Requests & Rewards...');
    const mobileCat = categories.find((c) => c.name === 'Mobiles');
    const batteryCat = categories.find((c) => c.name === 'Batteries');
    const applianceCat = categories.find((c) => c.name === 'Appliances');

    // 1. Scheduled pickup for Mobile Phones
    const pickup1 = new PickupRequest({
      citizen: citizenUser._id,
      category: mobileCat._id,
      quantity: 3,
      approximateWeight: 4.2,
      address: citizenUser.address,
      preferredDate: new Date(Date.now() + 86400000 * 2), // 2 days later
      agent: agentUser._id,
      collectionCentre: centres[0]._id,
      status: 'Scheduled'
    });
    await pickup1.save();

    // 2. Completed & Recycled pickup with reward points & cash money earned
    const pickup2 = new PickupRequest({
      citizen: citizenUser._id,
      category: batteryCat._id,
      quantity: 5,
      approximateWeight: 8.5,
      address: citizenUser.address,
      preferredDate: new Date(Date.now() - 86400000 * 5),
      agent: agentUser._id,
      collectionCentre: centres[0]._id,
      status: 'Recycled',
      rewardPointsEarned: 680,
      cashRewardEarned: 255.00
    });
    await pickup2.save();

    const reward2 = new Reward({
      citizen: citizenUser._id,
      pickup: pickup2._id,
      points: 680,
      cashAmount: 255.00,
      type: 'Earned',
      description: 'Recycled Batteries (8.5 KG)'
    });
    await reward2.save();

    // 3. New pending pickup request
    const pickup3 = new PickupRequest({
      citizen: citizenUser._id,
      category: applianceCat._id,
      quantity: 1,
      approximateWeight: 12.0,
      address: citizenUser.address,
      preferredDate: new Date(Date.now() + 86400000 * 3),
      status: 'Requested'
    });
    await pickup3.save();

    console.log('🌱 Seeding Notifications...');
    await Notification.insertMany([
      {
        user: citizenUser._id,
        title: 'Pickup Request Approved',
        message: 'Your pickup request #EW1024 has been approved by EcoLoop Admin.',
        type: 'success',
        link: `/citizen/pickup/${pickup1._id}`,
        isRead: false
      },
      {
        user: citizenUser._id,
        title: 'Agent Assigned',
        message: 'Agent Ramesh Agent has been assigned to your pickup request.',
        type: 'info',
        link: `/citizen/pickup/${pickup1._id}`,
        isRead: false
      },
      {
        user: citizenUser._id,
        title: '+680 Eco Points & ₹255 Earned!',
        message: 'E-waste recycling completed for Batteries (8.5 KG). Check your Eco Wallet!',
        type: 'reward',
        link: '/citizen/wallet',
        isRead: false
      }
    ]);

    console.log('✅ [EcoLoop Seed Success]: Database populated successfully!');
    console.log('\n--- DEMO USER CREDENTIALS ---');
    console.log('🔑 Citizen: prince@ecoloop.com / password123');
    console.log('🔑 Agent:   agent@ecoloop.com / password123');
    console.log('🔑 Admin:   admin@ecoloop.com / password123');
    console.log('-----------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedData();
