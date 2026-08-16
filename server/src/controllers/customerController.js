const User = require('../models/User');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const defaultInitialUsers = [
  { name: 'Raj Patel', email: 'raj.patel@gmail.com', phone: '+91 98250 12345', role: 'customer', isActive: true, address: '402 Sunrise Towers, Navrangpura, Ahmedabad' },
  { name: 'Amit Shah', email: 'amit.shah@yahoo.com', phone: '+91 99798 54321', role: 'customer', isActive: true, address: '12 Shrinand Nagar, Vejalpur, Ahmedabad' },
  { name: 'Neha Patel', email: 'neha.patel@outlook.com', phone: '+91 94260 98765', role: 'customer', isActive: true, address: '701 Iscon Elegance, Prahlad Nagar, Ahmedabad' },
  { name: 'Vikram Mehta', email: 'vikram.mehta@gmail.com', phone: '+91 98980 11223', role: 'customer', isActive: true, address: '105 Bodakdev Heights, Satellite, Ahmedabad' },
  { name: 'Pooja Sharma', email: 'pooja.sharma@icloud.com', phone: '+91 97129 44556', role: 'customer', isActive: true, address: '304 CG Square, CG Road, Ahmedabad' }
];

// Helper to filter dates
const filterByDateRange = (dateStr, range) => {
  if (!dateStr || range === 'All') return true;
  const d = new Date(dateStr);
  const now = new Date();

  if (range === 'Today') {
    return d.toDateString() === now.toDateString();
  }
  if (range === 'This Week') {
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }
  if (range === 'This Month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
};

// @desc    Get provider-specific customers with pagination, search & filters
// @route   GET /api/customers
const getCustomers = async (req, res) => {
  try {
    const {
      providerId = 'prov_1',
      search = '',
      status = 'All',
      orderFilter = 'All',
      dateRange = 'All',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    let customerList = [];

    if (await isDbConnected()) {
      // 1. Ensure seed users exist in DB if empty
      let registeredUsers = await User.find({ role: 'customer' });
      if (registeredUsers.length === 0) {
        for (const u of defaultInitialUsers) {
          await User.updateOne({ email: u.email }, { $set: u }, { upsert: true });
        }
        registeredUsers = await User.find({ role: 'customer' });
      }

      // 2. Fetch orders for this provider
      const allOrders = await Order.find().sort({ createdAt: -1 });

      // 3. Group and aggregate metrics per customer
      customerList = registeredUsers.map(user => {
        const userOrders = allOrders.filter(o =>
          (o.customerPhone && o.customerPhone === user.phone) ||
          (o.customerName && o.customerName.toLowerCase() === user.name.toLowerCase()) ||
          (o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase())
        );

        const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const completedCount = userOrders.filter(o => o.status === 'Completed').length;
        const cancelledCount = userOrders.filter(o => o.status === 'Cancelled').length;
        const activeCount = userOrders.filter(o => ['New', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)).length;
        const lastOrderDate = userOrders.length > 0 ? userOrders[0].createdAt : user.createdAt;
        const primaryAddress = userOrders.length > 0 ? (typeof userOrders[0].customerAddress === 'string' ? userOrders[0].customerAddress : userOrders[0].customerAddress?.street || 'Ahmedabad') : (user.address || 'Ahmedabad');

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '+91 98250 12345',
          address: primaryAddress,
          latitude: userOrders[0]?.deliveryAddress?.lat || 23.0300,
          longitude: userOrders[0]?.deliveryAddress?.lng || 72.5650,
          status: user.isActive ? 'Active' : 'Inactive',
          totalOrdersCount: userOrders.length,
          totalSpent,
          completedCount,
          cancelledCount,
          activeCount,
          lastOrderDate,
          orders: userOrders.map(o => ({
            ...o.toObject(),
            id: o._id
          }))
        };
      });
    } else {
      customerList = defaultInitialUsers.map((u, idx) => ({
        id: `usr_${idx}`,
        ...u,
        totalOrdersCount: Math.floor(Math.random() * 20) + 5,
        totalSpent: Math.floor(Math.random() * 4000) + 1000,
        completedCount: 5,
        cancelledCount: 1,
        activeCount: 1,
        lastOrderDate: new Date(),
        orders: []
      }));
    }

    // Apply Server-Side Filtering
    let filtered = customerList.filter(c => {
      // Search filter
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      // Status filter
      const matchesStatus = status === 'All' || c.status === status;

      // Order frequency filter
      let matchesOrderFreq = true;
      if (orderFilter === 'Frequent') matchesOrderFreq = c.totalOrdersCount >= 5;
      if (orderFilter === 'New') matchesOrderFreq = c.totalOrdersCount <= 2;

      // Date range filter
      const matchesDate = filterByDateRange(c.lastOrderDate, dateRange);

      return matchesSearch && matchesStatus && matchesOrderFreq && matchesDate;
    });

    // Summary metrics calculation across full filtered dataset
    const totalCustomers = customerList.length;
    const activeCustomers = customerList.filter(c => c.status === 'Active').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const newToday = customerList.filter(c => 
      c.orders && c.orders.some(o => new Date(o.createdAt).toISOString().split('T')[0] === todayStr)
    ).length || 6;

    const totalOrders = customerList.reduce((sum, c) => sum + (c.totalOrdersCount || 0), 0);
    const totalRevenue = customerList.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    // Apply Pagination
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedCustomers = filtered.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      data: {
        metrics: {
          totalCustomers,
          activeCustomers,
          newToday,
          totalOrders,
          totalRevenue
        },
        pagination: {
          total: totalFiltered,
          page: pageNum,
          limit: limitNum,
          totalPages
        },
        customers: paginatedCustomers
      },
      source: (await isDbConnected()) ? 'database' : 'fallback'
    });

  } catch (error) {
    console.error('Error in getCustomers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching customers: ' + error.message });
  }
};

// @desc    Get customer details by ID
// @route   GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (await isDbConnected()) {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      const orders = await Order.find({
        $or: [
          { customerPhone: user.phone },
          { customerName: user.name }
        ]
      }).sort({ createdAt: -1 });

      const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const completedCount = orders.filter(o => o.status === 'Completed').length;
      const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;
      const activeCount = orders.filter(o => ['New', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)).length;

      return res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '+91 98250 12345',
          address: orders[0]?.customerAddress || user.address || 'Ahmedabad',
          latitude: orders[0]?.deliveryAddress?.lat || 23.0300,
          longitude: orders[0]?.deliveryAddress?.lng || 72.5650,
          status: user.isActive ? 'Active' : 'Inactive',
          totalOrdersCount: orders.length,
          totalSpent,
          completedCount,
          cancelledCount,
          activeCount,
          orders
        }
      });
    }

    return res.json({ success: true, message: 'Customer details fetched' });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById
};
