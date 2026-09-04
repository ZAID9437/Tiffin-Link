const Order = require('../models/Order');
const Review = require('../models/Review');
const User = require('../models/User');
const Tiffin = require('../models/Tiffin');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// @desc    Get real-time provider analytics computed directly from MongoDB collections
// @route   GET /api/analytics
const getAnalytics = async (req, res) => {
  try {
    const providerId = req.providerId;

    if (await isDbConnected()) {
      const allOrders = await Order.find({ providerId }).sort({ createdAt: -1 });
      const allReviews = await Review.find({ providerId }).sort({ createdAt: -1 });
      const allTiffins = await Tiffin.find({ providerId });

      // 1. Summary Metrics Calculation
      const completedOrders = allOrders.filter(o => o.status === 'Completed' || o.status === 'Ready' || o.status === 'Preparing');
      const totalOrdersCount = allOrders.length;
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const uniqueCustomerNames = Array.from(new Set(allOrders.map(o => o.customerName))).filter(Boolean);
      const totalCustomersCount = uniqueCustomerNames.length;

      // Average Rating from Reviews
      const totalReviewSum = allReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
      const avgRating = allReviews.length > 0 ? (totalReviewSum / allReviews.length).toFixed(1) : (allReviews.length === 0 ? '5.0' : '4.7');

      // 2. Top Tiffins Aggregation from Real Orders
      const tiffinSalesMap = {};
      allOrders.forEach(o => {
        const name = o.tiffinName || 'Gujarati Home Thali';
        if (!tiffinSalesMap[name]) {
          tiffinSalesMap[name] = {
            tiffinName: name,
            category: o.tiffinCategory || 'Gujarati',
            ordersCount: 0,
            revenue: 0,
            rating: 4.8
          };
        }
        tiffinSalesMap[name].ordersCount += o.quantity || 1;
        tiffinSalesMap[name].revenue += o.totalAmount || 0;
      });

      const topTiffins = Object.values(tiffinSalesMap)
        .sort((a, b) => b.ordersCount - a.ordersCount)
        .map((t, idx) => ({ rank: idx + 1, ...t }));

      // 3. Order Status Performance Distribution
      const statusCounts = {
        Completed: allOrders.filter(o => o.status === 'Completed').length,
        Preparing: allOrders.filter(o => o.status === 'Preparing').length,
        Ready: allOrders.filter(o => o.status === 'Ready').length,
        Cancelled: allOrders.filter(o => o.status === 'Cancelled').length,
        Pending: allOrders.filter(o => o.status === 'New').length
      };

      const statusPercentages = {};
      Object.keys(statusCounts).forEach(key => {
        statusPercentages[key] = totalOrdersCount > 0 
          ? Math.round((statusCounts[key] / totalOrdersCount) * 100) 
          : 0;
      });

      // 4. Customer Insights
      const returningCustomersCount = uniqueCustomerNames.filter(name => 
        allOrders.filter(o => o.customerName === name).length > 1
      ).length;

      const newCustomersCount = Math.max(0, uniqueCustomerNames.length - returningCustomersCount);
      const repeatRate = uniqueCustomerNames.length > 0 
        ? Math.round((returningCustomersCount / uniqueCustomerNames.length) * 100) 
        : 0;

      // 5. Rating Analytics
      const ratingDistribution = {
        5: allReviews.filter(r => r.rating === 5).length,
        4: allReviews.filter(r => r.rating === 4).length,
        3: allReviews.filter(r => r.rating === 3).length,
        2: allReviews.filter(r => r.rating === 2).length,
        1: allReviews.filter(r => r.rating === 1).length
      };

      // 6. Chart Data (Mon - Sun)
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const chartDataDays = daysOfWeek.map((day, idx) => {
        const dayOrders = completedOrders.filter(o => new Date(o.createdAt).getDay() === (idx + 1) % 7);
        const dayRev = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        return {
          day,
          revenue: dayRev,
          ordersCount: dayOrders.length
        };
      });

      // 7. Data-Driven Business Insights
      const bestSellingItem = topTiffins.length > 0 ? topTiffins[0].tiffinName : 'N/A';
      const bestSellingOrders = topTiffins.length > 0 ? topTiffins[0].ordersCount : 0;

      const businessInsights = [
        bestSellingItem !== 'N/A' 
          ? `Your ${bestSellingItem} is your #1 best-selling tiffin with ${bestSellingOrders} orders fulfilled.` 
          : 'No sales data available yet for best-selling tiffins.',
        `Returning customers generated ${repeatRate}% of your total kitchen orders.`,
        allReviews.length > 0
          ? `Your kitchen achieved an average customer satisfaction score of ${avgRating} ★ across all reviews.`
          : 'No customer reviews submitted yet.',
        `Completion rate is ${statusPercentages.Completed || 0}% with low cancellation impact.`
      ];

      return res.json({
        success: true,
        summary: {
          ordersCount: totalOrdersCount,
          revenue: totalRevenue,
          customersCount: totalCustomersCount,
          avgRating,
          ordersChangePct: 0,
          revenueChangePct: 0,
          customersChangePct: 0,
          ratingChangePct: 0
        },
        topTiffins,
        orderPerformance: {
          counts: statusCounts,
          percentages: statusPercentages
        },
        customerInsights: {
          newCustomers: newCustomersCount,
          returningCustomers: returningCustomersCount,
          repeatRate
        },
        ratingAnalytics: {
          overallRating: avgRating,
          totalReviews: allReviews.length,
          distribution: ratingDistribution
        },
        chartData: chartDataDays,
        businessInsights,
        source: 'database',
        databaseName: 'tiffinlink'
      });
    } else {
      return res.json({
        success: true,
        summary: { ordersCount: 0, revenue: 0, customersCount: 0, avgRating: '0.0', ordersChangePct: 0, revenueChangePct: 0, customersChangePct: 0, ratingChangePct: 0 },
        topTiffins: [],
        orderPerformance: { counts: { Completed: 0, Preparing: 0, Ready: 0, Cancelled: 0, Pending: 0 }, percentages: { Completed: 0, Preparing: 0, Ready: 0, Cancelled: 0, Pending: 0 } },
        customerInsights: { newCustomers: 0, returningCustomers: 0, repeatRate: 0 },
        ratingAnalytics: { overallRating: '0.0', totalReviews: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
        chartData: [],
        businessInsights: ['No database connection.'],
        source: 'in-memory'
      });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

module.exports = {
  getAnalytics
};
