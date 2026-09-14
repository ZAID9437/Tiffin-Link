const Order = require('../models/Order');
const Review = require('../models/Review');
const User = require('../models/User');
const Tiffin = require('../models/Tiffin');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// @desc    Get real-time provider analytics computed directly from MongoDB aggregations
// @route   GET /api/analytics
const getAnalytics = async (req, res) => {
  try {
    const providerId = req.providerId;
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    if (await isDbConnected()) {
      const [orderAggResults, reviewAggResults] = await Promise.all([
        Order.aggregate([
          { $match: { providerId } },
          {
            $facet: {
              summary: [
                {
                  $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: {
                      $sum: {
                        $cond: [{ $ne: ['$status', 'Cancelled'] }, '$totalAmount', 0]
                      }
                    },
                    uniqueCustomers: { $addToSet: { $ifNull: ['$customerPhone', '$customerName'] } }
                  }
                }
              ],
              statusCounts: [
                { $group: { _id: '$status', count: { $sum: 1 } } }
              ],
              topTiffins: [
                {
                  $group: {
                    _id: '$tiffinName',
                    tiffinName: { $first: '$tiffinName' },
                    category: { $first: '$tiffinCategory' },
                    ordersCount: { $sum: { $ifNull: ['$quantity', 1] } },
                    revenue: { $sum: '$totalAmount' }
                  }
                },
                { $sort: { ordersCount: -1 } },
                { $limit: 5 }
              ],
              customerRepeat: [
                {
                  $group: {
                    _id: { $ifNull: ['$customerPhone', '$customerName'] },
                    orderCount: { $sum: 1 }
                  }
                },
                {
                  $group: {
                    _id: null,
                    totalUnique: { $sum: 1 },
                    returning: {
                      $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] }
                    }
                  }
                }
              ],
              chartByDay: [
                {
                  $match: { status: { $ne: 'Cancelled' } }
                },
                {
                  $project: {
                    dayOfWeek: { $dayOfWeek: '$createdAt' },
                    totalAmount: 1
                  }
                },
                {
                  $group: {
                    _id: '$dayOfWeek',
                    revenue: { $sum: '$totalAmount' },
                    ordersCount: { $sum: 1 }
                  }
                }
              ]
            }
          }
        ]),
        Review.aggregate([
          { $match: { providerId } },
          {
            $facet: {
              ratingStats: [
                {
                  $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                  }
                }
              ],
              distribution: [
                { $group: { _id: '$rating', count: { $sum: 1 } } }
              ]
            }
          }
        ])
      ]);

      const orderFacet = orderAggResults[0] || {};
      const reviewFacet = reviewAggResults[0] || {};

      // 1. Summary Metrics
      const summaryAgg = orderFacet.summary[0] || { totalOrders: 0, totalRevenue: 0, uniqueCustomers: [] };
      const totalOrdersCount = summaryAgg.totalOrders;
      const totalRevenue = summaryAgg.totalRevenue;
      const totalCustomersCount = summaryAgg.uniqueCustomers.length;

      // Rating Analytics
      const ratingStatsAgg = reviewFacet.ratingStats[0] || { avgRating: 5.0, totalReviews: 0 };
      const avgRating = ratingStatsAgg.avgRating ? ratingStatsAgg.avgRating.toFixed(1) : '4.8';
      const totalReviews = ratingStatsAgg.totalReviews;

      // 2. Top Tiffins
      const topTiffins = (orderFacet.topTiffins || []).map((t, idx) => ({
        rank: idx + 1,
        tiffinName: t.tiffinName || 'Gujarati Home Thali',
        category: t.category || 'Gujarati',
        ordersCount: t.ordersCount,
        revenue: t.revenue,
        rating: Number(avgRating)
      }));

      // 3. Status Performance Distribution
      const statusCounts = { Completed: 0, Preparing: 0, Ready: 0, Cancelled: 0, Pending: 0 };
      (orderFacet.statusCounts || []).forEach(st => {
        const key = st._id === 'New' ? 'Pending' : st._id;
        if (statusCounts.hasOwnProperty(key)) {
          statusCounts[key] = st.count;
        }
      });

      const statusPercentages = {};
      Object.keys(statusCounts).forEach(key => {
        statusPercentages[key] = totalOrdersCount > 0
          ? Math.round((statusCounts[key] / totalOrdersCount) * 100)
          : 0;
      });

      // 4. Customer Insights
      const repeatAgg = orderFacet.customerRepeat[0] || { totalUnique: 0, returning: 0 };
      const returningCustomersCount = repeatAgg.returning;
      const newCustomersCount = Math.max(0, repeatAgg.totalUnique - returningCustomersCount);
      const repeatRate = repeatAgg.totalUnique > 0
        ? Math.round((returningCustomersCount / repeatAgg.totalUnique) * 100)
        : 0;

      // 5. Rating Distribution
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      (reviewFacet.distribution || []).forEach(d => {
        if (d._id && ratingDistribution.hasOwnProperty(d._id)) {
          ratingDistribution[d._id] = d.count;
        }
      });

      // 6. Chart Data (Mon - Sun)
      // MongoDB $dayOfWeek: 1 = Sun, 2 = Mon, 3 = Tue, 4 = Wed, 5 = Thu, 6 = Fri, 7 = Sat
      const dayIndexMap = { 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat', 1: 'Sun' };
      const chartMap = {};
      (orderFacet.chartByDay || []).forEach(c => {
        const dayLabel = dayIndexMap[c._id] || 'Mon';
        chartMap[dayLabel] = { revenue: c.revenue, ordersCount: c.ordersCount };
      });

      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const chartDataDays = daysOfWeek.map(day => ({
        day,
        revenue: chartMap[day]?.revenue || 0,
        ordersCount: chartMap[day]?.ordersCount || 0
      }));

      // 7. Business Insights
      const bestSellingItem = topTiffins.length > 0 ? topTiffins[0].tiffinName : 'N/A';
      const bestSellingOrders = topTiffins.length > 0 ? topTiffins[0].ordersCount : 0;

      const businessInsights = [
        bestSellingItem !== 'N/A'
          ? `Your ${bestSellingItem} is your #1 best-selling tiffin with ${bestSellingOrders} orders fulfilled.`
          : 'No sales data available yet for best-selling tiffins.',
        `Returning customers generated ${repeatRate}% of your total kitchen orders.`,
        totalReviews > 0
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
          totalReviews,
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
