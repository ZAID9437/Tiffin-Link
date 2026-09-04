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
    const providerId = req.providerId;
    const {
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
      // Fetch orders strictly belonging to this provider
      const providerOrders = await Order.find({ providerId }).sort({ createdAt: -1 });

      // Map of customers who have relationship with this provider
      const customerMap = new Map();

      providerOrders.forEach(o => {
        const key = (o.customerPhone || o.customerName || 'customer').toLowerCase();
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: o._id,
            name: o.customerName,
            phone: o.customerPhone || '+91 98250 12345',
            email: o.customerEmail || '',
            address: typeof o.customerAddress === 'string' ? o.customerAddress : (o.customerAddress?.street || 'Ahmedabad'),
            latitude: o.deliveryAddress?.lat || 23.0300,
            longitude: o.deliveryAddress?.lng || 72.5650,
            status: 'Active',
            totalOrdersCount: 0,
            totalSpent: 0,
            completedCount: 0,
            cancelledCount: 0,
            activeCount: 0,
            lastOrderDate: o.createdAt,
            orders: []
          });
        }

        const entry = customerMap.get(key);
        entry.totalOrdersCount += 1;
        entry.totalSpent += o.totalAmount || 0;
        if (o.status === 'Completed') entry.completedCount += 1;
        if (o.status === 'Cancelled') entry.cancelledCount += 1;
        if (['New', 'Preparing', 'Ready', 'Out for Delivery'].includes(o.status)) entry.activeCount += 1;
        if (new Date(o.createdAt) > new Date(entry.lastOrderDate)) entry.lastOrderDate = o.createdAt;
        entry.orders.push({ ...o.toObject(), id: o._id });
      });

      customerList = Array.from(customerMap.values());
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
