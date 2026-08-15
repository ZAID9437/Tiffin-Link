const User = require('../models/User');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const defaultInitialUsers = [
  {
    name: 'Raj Patel',
    email: 'raj.patel@gmail.com',
    phone: '+91 98250 12345',
    role: 'customer',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Amit Shah',
    email: 'amit.shah@yahoo.com',
    phone: '+91 99798 54321',
    role: 'customer',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Neha Patel',
    email: 'neha.patel@outlook.com',
    phone: '+91 94260 98765',
    role: 'customer',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Vikram Mehta',
    email: 'vikram.mehta@gmail.com',
    phone: '+91 98980 11223',
    role: 'customer',
    isActive: true,
    isVerified: true
  },
  {
    name: 'Pooja Sharma',
    email: 'pooja.sharma@icloud.com',
    phone: '+91 97129 44556',
    role: 'customer',
    isActive: true,
    isVerified: true
  }
];

// @desc    Get all customers with real MongoDB aggregation from users & orders collections
// @route   GET /api/customers
const getCustomers = async (req, res) => {
  try {
    if (await isDbConnected()) {
      // 1. Ensure seed users exist in MongoDB users collection
      let registeredUsers = await User.find({ role: 'customer' });
      if (registeredUsers.length === 0) {
        for (const u of defaultInitialUsers) {
          await User.updateOne({ email: u.email }, { $set: u }, { upsert: true });
        }
        registeredUsers = await User.find({ role: 'customer' });
      }

      // 2. Fetch all real orders from MongoDB orders collection
      const allOrders = await Order.find().sort({ createdAt: -1 });

      // 3. Map & Aggregate real MongoDB users with their real order metrics
      const customerData = registeredUsers.map(user => {
        const userOrders = allOrders.filter(o => 
          (o.customerPhone && o.customerPhone === user.phone) ||
          (o.customerName && o.customerName.toLowerCase() === user.name.toLowerCase())
        );

        const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const completedCount = userOrders.filter(o => o.status === 'Completed').length;
        const cancelledCount = userOrders.filter(o => o.status === 'Cancelled').length;
        const lastOrderDate = userOrders.length > 0 ? userOrders[0].createdAt : user.createdAt;
        const primaryAddress = userOrders.length > 0 ? userOrders[0].customerAddress : 'Ahmedabad';

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '+91 98765 43210',
          address: primaryAddress,
          status: user.isActive ? 'Active' : 'Inactive',
          totalOrdersCount: userOrders.length,
          totalSpent,
          completedCount,
          cancelledCount,
          lastOrderDate,
          orders: userOrders.map(o => ({
            ...o.toObject(),
            id: o._id
          }))
        };
      });

      return res.json({
        success: true,
        data: customerData,
        source: 'database',
        databaseName: 'tiffinlink',
        collectionsUsed: ['users', 'orders']
      });
    } else {
      return res.json({
        success: true,
        data: defaultInitialUsers.map((u, idx) => ({ id: `usr_${idx}`, ...u, totalOrdersCount: 1, totalSpent: 300, orders: [] })),
        source: 'in-memory'
      });
    }
  } catch (error) {
    console.error('Error fetching customers from MongoDB:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

module.exports = {
  getCustomers
};
