const Hostel = require('../models/Hostel');
const GroupOrder = require('../models/GroupOrder');
const GroupOrderSelection = require('../models/GroupOrderSelection');
const MealRequest = require('../models/MealRequest');
const { getIO } = require('./socketService');

// Create a new hostel / PG profile
const createHostel = async ({
  hostelCode,
  name,
  type = 'PG',
  address,
  wardenName,
  wardenPhone,
  wardenEmail,
  totalResidentsCount = 50,
  dropPointInstructions,
  coordinators = []
}) => {
  const existing = await Hostel.findOne({ hostelCode: hostelCode.toUpperCase() });
  if (existing) {
    throw new Error('A residence with this code already exists.');
  }

  const hostel = new Hostel({
    hostelCode: hostelCode.toUpperCase(),
    name,
    type,
    address,
    wardenName,
    wardenPhone,
    wardenEmail,
    totalResidentsCount,
    dropPointInstructions: dropPointInstructions || 'Leave at security gate reception counter',
    coordinators
  });

  await hostel.save();
  return hostel;
};

// Create a bulk group order window for residents
const createHostelGroupOrder = async ({
  hostelId,
  title,
  mealType = 'Dinner',
  date,
  cutoffMinutesFromNow = 60,
  targetDeliveryTime = '20:30',
  minimumOrdersNeeded = 10,
  bulkDiscountPercent = 15,
  coordinatorId,
  coordinatorName
}) => {
  const hostel = await Hostel.findById(hostelId);
  if (!hostel) {
    throw new Error('Hostel / PG residence not found');
  }

  const now = new Date();
  const orderCutoffTime = new Date(now.getTime() + cutoffMinutesFromNow * 60 * 1000);
  const groupOrderId = `HOSTEL-${Math.floor(1000 + Math.random() * 9000)}`;

  const groupOrder = new GroupOrder({
    groupOrderId,
    hostelId: hostel._id,
    title: title || `${hostel.name} - ${mealType} Pool`,
    mealType,
    date: date || 'Today',
    orderCutoffTime,
    targetDeliveryTime,
    minimumOrdersNeeded,
    bulkDiscountPercent,
    status: 'open',
    createdByCoordinatorId: coordinatorId || 'COORD-1',
    coordinatorName: coordinatorName || hostel.wardenName
  });

  await groupOrder.save();

  // Socket broadcast to residents
  try {
    const io = getIO();
    if (io) {
      io.emit('hostel:group_order_opened', {
        groupOrderId,
        hostelName: hostel.name,
        mealType,
        orderCutoffTime,
        bulkDiscountPercent
      });
    }
  } catch (sErr) {}

  return groupOrder;
};

// Individual resident submits meal choice into open group order
const submitResidentSelection = async ({
  groupOrderId,
  residentUserId,
  residentName,
  residentRoomNumber,
  residentPhone,
  selectedMeal,
  quantity = 1,
  unitPrice = 130,
  specialInstructions = ''
}) => {
  const groupOrder = await GroupOrder.findOne({ groupOrderId });
  if (!groupOrder) {
    throw new Error('Group order pool not found');
  }

  if (groupOrder.status !== 'open') {
    throw new Error('This group meal pool is no longer accepting new selections.');
  }

  if (new Date() > new Date(groupOrder.orderCutoffTime)) {
    groupOrder.status = 'cutoff_passed';
    await groupOrder.save();
    throw new Error('The deadline for joining this meal pool has passed.');
  }

  const basePrice = Number(unitPrice) || 130;
  const qty = Number(quantity) || 1;
  const discountMultiplier = (100 - (groupOrder.bulkDiscountPercent || 15)) / 100;
  const finalPrice = Math.round(basePrice * discountMultiplier);

  const selection = await GroupOrderSelection.findOneAndUpdate(
    { groupOrderId: groupOrder._id, residentUserId },
    {
      residentName,
      residentRoomNumber,
      residentPhone,
      selectedMeal,
      quantity: qty,
      unitPrice: basePrice,
      finalPriceAfterDiscount: finalPrice * qty,
      specialInstructions,
      paymentStatus: 'paid',
      submittedAt: new Date()
    },
    { upsert: true, new: true }
  );

  // Re-aggregate totals
  const allSelections = await GroupOrderSelection.find({ groupOrderId: groupOrder._id });
  let totalCount = 0;
  let totalAmount = 0;

  allSelections.forEach(s => {
    totalCount += s.quantity;
    totalAmount += s.finalPriceAfterDiscount;
  });

  groupOrder.totalSelectionsCount = totalCount;
  groupOrder.totalGroupAmount = totalAmount;
  await groupOrder.save();

  // Socket notification of progress towards bulk discount target
  try {
    const io = getIO();
    if (io) {
      io.emit('hostel:pool_updated', {
        groupOrderId,
        totalSelectionsCount: totalCount,
        minimumOrdersNeeded: groupOrder.minimumOrdersNeeded
      });
    }
  } catch (sErr) {}

  return selection;
};

// Finalize group order & consolidate into central MealRequest
const finalizeHostelGroupOrder = async (groupOrderId) => {
  const groupOrder = await GroupOrder.findOne({ groupOrderId }).populate('hostelId');
  if (!groupOrder) {
    throw new Error('Group order not found');
  }

  const selections = await GroupOrderSelection.find({ groupOrderId: groupOrder._id });
  if (selections.length === 0) {
    throw new Error('Cannot finalize an empty group order pool with no resident selections.');
  }

  // Consolidate meal items breakdown
  const mealMap = {};
  let totalAmount = 0;
  let totalItemsCount = 0;

  selections.forEach(sel => {
    const key = sel.selectedMeal;
    if (!mealMap[key]) {
      mealMap[key] = {
        mealName: sel.selectedMeal,
        dietary: sel.selectedMeal.toLowerCase().includes('jain') ? 'Jain' : 'Veg',
        quantity: 0,
        unitPrice: Math.round(sel.finalPriceAfterDiscount / sel.quantity)
      };
    }
    mealMap[key].quantity += sel.quantity;
    totalAmount += sel.finalPriceAfterDiscount;
    totalItemsCount += sel.quantity;
  });

  const consolidatedList = Object.values(mealMap);

  groupOrder.consolidatedMealBreakdown = consolidatedList;
  groupOrder.totalSelectionsCount = totalItemsCount;
  groupOrder.totalGroupAmount = totalAmount;
  groupOrder.status = 'dispatched_to_kitchen';

  const hostel = groupOrder.hostelId;

  // Bridge into central MealRequest
  const mealReq = new MealRequest({
    customerName: `${hostel ? hostel.name : 'Hostel'} Batch (${groupOrder.coordinatorName})`,
    customerPhone: hostel ? hostel.wardenPhone : '+91 98765 43210',
    mealType: `Hostel Bulk Pool: ${groupOrder.title} (${totalItemsCount} Meals)`,
    category: 'Hostel Bulk',
    budget: Math.round(totalAmount / totalItemsCount),
    quantity: totalItemsCount,
    totalAmount,
    items: consolidatedList.map(c => ({
      name: c.mealName,
      qty: c.quantity,
      price: c.unitPrice
    })),
    location: hostel ? hostel.address : 'Ahmedabad',
    customerAddress: hostel ? hostel.address : 'Ahmedabad',
    specialInstructions: `[DROP POINT: ${hostel ? hostel.dropPointInstructions : 'Gate'}] Packed for ${selections.length} students.`,
    hostelId: hostel ? hostel._id : null,
    groupOrderId: groupOrder._id,
    status: 'pending',
    urgencyLevel: 'standard'
  });
  await mealReq.save();

  groupOrder.linkedMealRequestId = mealReq._id;
  await groupOrder.save();

  // Socket notification
  try {
    const io = getIO();
    if (io) {
      io.emit('hostel:order_finalized', {
        groupOrderId,
        linkedMealRequestId: mealReq._id,
        totalItemsCount,
        totalAmount
      });
      io.emit('request:new', mealReq);
    }
  } catch (sErr) {}

  return {
    success: true,
    groupOrder,
    linkedMealRequestId: mealReq._id
  };
};

module.exports = {
  createHostel,
  createHostelGroupOrder,
  submitResidentSelection,
  finalizeHostelGroupOrder
};
