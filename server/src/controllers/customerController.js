const User = require('../models/User');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

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
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

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
      const groupedCustomers = await Order.aggregate([
        { $match: { providerId } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: { $toLower: { $ifNull: ['$customerPhone', '$customerName'] } },
            id: { $first: '$_id' },
            name: { $first: '$customerName' },
            phone: { $first: { $ifNull: ['$customerPhone', ''] } },
            email: { $first: { $ifNull: ['$customerEmail', ''] } },
            address: { $first: '$customerAddress' },
            totalOrdersCount: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            cancelledCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
            },
            activeCount: {
              $sum: {
                $cond: [{ $in: ['$status', ['New', 'Preparing', 'Ready', 'Out for Delivery']] }, 1, 0]
              }
            },
            lastOrderDate: { $max: '$createdAt' }
          }
        },
        { $sort: { lastOrderDate: -1 } }
      ]);

      customerList = groupedCustomers.map(c => ({
        id: c.id,
        name: c.name || 'Customer',
        phone: c.phone || '',
        email: c.email || '',
        address: typeof c.address === 'string' ? c.address : (c.address?.street || ''),
        status: 'Active',
        totalOrdersCount: c.totalOrdersCount,
        totalSpent: c.totalSpent,
        completedCount: c.completedCount,
        cancelledCount: c.cancelledCount,
        activeCount: c.activeCount,
        lastOrderDate: c.lastOrderDate,
        orders: [] // Keep lightweight array for UI summary drawer
      }));
    } else {
      customerList = [];
    }

    // Apply Filters
    let filtered = customerList.filter(c => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      const matchesStatus = status === 'All' || c.status === status;

      let matchesOrderFreq = true;
      if (orderFilter === 'Frequent') matchesOrderFreq = c.totalOrdersCount >= 5;
      if (orderFilter === 'New') matchesOrderFreq = c.totalOrdersCount <= 2;

      const matchesDate = filterByDateRange(c.lastOrderDate, dateRange);

      return matchesSearch && matchesStatus && matchesOrderFreq && matchesDate;
    });

    const totalCustomers = customerList.length;
    const activeCustomers = customerList.filter(c => c.status === 'Active').length;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const newToday = customerList.filter(c => new Date(c.lastOrderDate) >= startOfToday).length;

    const totalOrders = customerList.reduce((sum, c) => sum + c.totalOrdersCount, 0);
    const totalRevenue = customerList.reduce((sum, c) => sum + c.totalSpent, 0);

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
          phone: user.phone || '',
          address: orders[0]?.customerAddress || user.address || '',
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

// @desc    Get customer's saved addresses
// @route   GET /api/customers/addresses
const getCustomerAddresses = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const user = await User.findById(req.user._id);
    return res.json({ success: true, data: user?.savedAddresses || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add a saved address for customer
// @route   POST /api/customers/addresses
const addCustomerAddress = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { label, fullName, phone, street, area, city, state, pincode, lat, lng, landmark, isDefault } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.savedAddresses = user.savedAddresses || [];
    if (isDefault) {
      user.savedAddresses.forEach(a => { a.isDefault = false; });
    }
    user.savedAddresses.push({
      label: label || 'Home',
      fullName: fullName || user.name,
      phone: phone || user.phone,
      street: street || '',
      area: area || '',
      city: city || 'Ahmedabad',
      state: state || 'Gujarat',
      pincode: pincode || '',
      lat: Number(lat) || 23.0300,
      lng: Number(lng) || 72.5178,
      landmark: landmark || '',
      isDefault: Boolean(isDefault)
    });
    await user.save();
    return res.status(201).json({ success: true, message: 'Address saved successfully', data: user.savedAddresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a saved address
// @route   DELETE /api/customers/addresses/:id
const deleteCustomerAddress = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.savedAddresses = (user.savedAddresses || []).filter(a => String(a._id) !== String(id));
    await user.save();
    return res.json({ success: true, message: 'Address removed', data: user.savedAddresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  getCustomerAddresses,
  addCustomerAddress,
  deleteCustomerAddress
};
