const Organization = require('../models/Organization');
const OrganizationMembership = require('../models/OrganizationMembership');
const CorporateMealOrder = require('../models/CorporateMealOrder');
const MealRequest = require('../models/MealRequest');
const Order = require('../models/Order');
const { getIO } = require('./socketService');

// Create a new corporate organization
const createOrganization = async ({
  orgCode,
  name,
  businessEmailDomain,
  contactPerson,
  contactEmail,
  contactPhone,
  taxIdGst,
  billingAddress,
  monthlyBudgetLimit = 50000,
  dailyPerMealSubsidy = 150,
  deliverySites = [],
  createdByUserId
}) => {
  const existing = await Organization.findOne({
    $or: [{ orgCode: orgCode.toUpperCase() }, { businessEmailDomain: businessEmailDomain.toLowerCase() }]
  });

  if (existing) {
    throw new Error('An organization with this code or email domain already exists.');
  }

  const org = new Organization({
    orgCode: orgCode.toUpperCase(),
    name,
    businessEmailDomain: businessEmailDomain.toLowerCase(),
    contactPerson,
    contactEmail,
    contactPhone,
    taxIdGst,
    billingAddress,
    monthlyBudgetLimit,
    dailyPerMealSubsidy,
    deliverySites: deliverySites.length > 0 ? deliverySites : [{
      siteName: 'Headquarters Main Cafeteria',
      floorRoom: 'Floor 3',
      address: billingAddress || 'Titanium Square, S.G. Highway, Ahmedabad',
      contactPerson,
      contactPhone
    }],
    createdByUserId
  });

  await org.save();

  // Create membership for creator as org_admin
  await OrganizationMembership.create({
    organizationId: org._id,
    userId: createdByUserId,
    email: contactEmail.toLowerCase(),
    name: contactPerson,
    role: 'org_admin'
  });

  return org;
};

// Add or invite member to organization
const addOrganizationMember = async ({
  organizationId,
  userId,
  email,
  name,
  role = 'employee',
  department = 'Engineering',
  monthlyAllowance = 3000
}) => {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw new Error('Organization not found');
  }

  const member = await OrganizationMembership.findOneAndUpdate(
    { organizationId, email: email.toLowerCase() },
    {
      userId,
      name,
      role,
      department,
      monthlyAllowance,
      status: 'active'
    },
    { upsert: true, new: true }
  );

  return member;
};

// Create a corporate group meal order
const createCorporateMealOrder = async ({
  organizationId,
  coordinatorUserId,
  coordinatorName,
  title,
  eventDate,
  deliveryTimeSlot,
  deliverySiteName,
  deliveryAddress,
  attendees = []
}) => {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw new Error('Organization not found');
  }

  const corporateOrderId = `CORP-${Math.floor(1000 + Math.random() * 9000)}`;
  const headcount = Math.max(1, attendees.length);

  // Compute pricing breakdown
  const subsidyPerHead = org.dailyPerMealSubsidy || 150;
  let estimatedTotal = 0;
  let companySubsidyTotal = 0;

  const processedAttendees = attendees.map(att => {
    const mealPrice = att.mealPrice || 140;
    estimatedTotal += mealPrice;
    const subAmount = Math.min(mealPrice, subsidyPerHead);
    companySubsidyTotal += subAmount;
    return {
      employeeUserId: att.employeeUserId || 'EMP-1',
      employeeName: att.employeeName || 'Corporate Diner',
      mealChoice: att.mealChoice || 'Standard Executive Thali',
      dietaryPreference: att.dietaryPreference || 'Veg',
      subsidizedAmount: subAmount,
      employeeCoPay: Math.max(0, mealPrice - subAmount)
    };
  });

  // Verify monthly budget cap
  if (org.currentMonthSpent + companySubsidyTotal > org.monthlyBudgetLimit) {
    throw new Error(`Order subsidy (₹${companySubsidyTotal}) exceeds remaining monthly company budget cap (Remaining: ₹${org.monthlyBudgetLimit - org.currentMonthSpent}).`);
  }

  const corporateOrder = new CorporateMealOrder({
    corporateOrderId,
    organizationId: org._id,
    title,
    eventDate: eventDate || 'Today',
    deliveryTimeSlot: deliveryTimeSlot || '13:00 - 13:30',
    deliverySiteName: deliverySiteName || org.deliverySites[0]?.siteName || 'HQ Main Desk',
    deliveryAddress: deliveryAddress || org.deliverySites[0]?.address || org.billingAddress,
    coordinatorUserId,
    coordinatorName,
    attendees: processedAttendees,
    headcount,
    estimatedTotalBudget: estimatedTotal,
    finalTotalAmount: estimatedTotal,
    companySubsidizedTotal: companySubsidyTotal,
    approvalStatus: 'pending_approval'
  });

  await corporateOrder.save();

  // Socket notification
  try {
    const io = getIO();
    if (io) {
      io.emit('corporate:order_created', {
        corporateOrderId,
        orgName: org.name,
        headcount,
        totalBudget: estimatedTotal
      });
    }
  } catch (sErr) {}

  return corporateOrder;
};

// Approve corporate meal order & bridge into Central Dispatch Flow
const approveCorporateMealOrder = async ({
  corporateOrderId,
  approvedByUserId
}) => {
  const corpOrder = await CorporateMealOrder.findOne({ corporateOrderId });
  if (!corpOrder) {
    throw new Error('Corporate order not found');
  }

  if (corpOrder.approvalStatus === 'approved') {
    throw new Error('This corporate order has already been approved.');
  }

  const org = await Organization.findById(corpOrder.organizationId);

  corpOrder.approvalStatus = 'approved';
  corpOrder.approvedByUserId = approvedByUserId;
  corpOrder.approvedAt = new Date();

  // Deduct from organization monthly budget
  if (org) {
    org.currentMonthSpent += corpOrder.companySubsidizedTotal;
    await org.save();
  }

  // Create real MealRequest in central system
  const mealReq = new MealRequest({
    customerName: `${org ? org.name : 'Corporate'} (${corpOrder.coordinatorName})`,
    customerPhone: org ? org.contactPhone : '+91 98765 43210',
    customerEmail: org ? org.contactEmail : '',
    customerId: corpOrder.coordinatorUserId,
    mealType: `Corporate Catering: ${corpOrder.title} (${corpOrder.headcount} Meals)`,
    category: 'Corporate Bulk',
    budget: Math.round(corpOrder.estimatedTotalBudget / corpOrder.headcount),
    quantity: corpOrder.headcount,
    totalAmount: corpOrder.finalTotalAmount,
    location: corpOrder.deliveryAddress,
    customerAddress: corpOrder.deliveryAddress,
    time: corpOrder.deliveryTimeSlot,
    date: corpOrder.eventDate,
    corporateId: corpOrder.organizationId,
    status: 'pending',
    urgencyLevel: 'standard'
  });
  await mealReq.save();

  corpOrder.linkedMealRequestId = mealReq._id;
  await corpOrder.save();

  // Real-time broadcast
  try {
    const io = getIO();
    if (io) {
      io.emit('corporate:order_approved', {
        corporateOrderId,
        linkedMealRequestId: mealReq._id,
        headcount: corpOrder.headcount,
        totalAmount: corpOrder.finalTotalAmount
      });
      io.emit('request:new', mealReq);
    }
  } catch (sErr) {}

  return {
    success: true,
    corporateOrder,
    linkedMealRequestId: mealReq._id
  };
};

module.exports = {
  createOrganization,
  addOrganizationMember,
  createCorporateMealOrder,
  approveCorporateMealOrder
};
