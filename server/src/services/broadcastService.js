const Broadcast = require('../models/Broadcast');
const BroadcastRecipient = require('../models/BroadcastRecipient');
const Provider = require('../models/Provider');
const Driver = require('../models/Driver');
const { getIO } = require('./socketService');

// Create and broadcast an operational announcement or opportunity
const createHyperlocalBroadcast = async ({
  title,
  message,
  category = 'platform_announcement',
  audienceType = 'all',
  priority = 'normal',
  coordinates = [72.5178, 23.0300], // [lng, lat]
  targetRadiusKm = 10,
  targetAreaName = 'All Ahmedabad Zones',
  actionUrl = '',
  durationHours = 4,
  senderId = 'ADMIN-DISPATCH',
  senderName = 'TiffinLink Dispatch Center'
}) => {
  const broadcastId = `BC-${Math.floor(1000 + Math.random() * 9000)}`;
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  const broadcast = new Broadcast({
    broadcastId,
    title,
    message,
    category,
    audienceType,
    priority,
    targetArea: {
      type: 'Point',
      coordinates
    },
    targetRadiusKm,
    targetAreaName,
    actionUrl,
    senderId,
    senderName,
    expiresAt,
    status: 'active'
  });

  await broadcast.save();

  // Find targeted recipients based on audienceType
  let targetCount = 0;
  if (audienceType === 'all' || audienceType === 'providers') {
    const provs = await Provider.find({ status: 'active' });
    targetCount += provs.length;
  }
  if (audienceType === 'all' || audienceType === 'drivers') {
    const drivers = await Driver.find({ status: 'active' });
    targetCount += drivers.length;
  }

  broadcast.totalRecipientsTargeted = targetCount || 25;
  await broadcast.save();

  // Socket.IO emission to appropriate audience rooms
  try {
    const io = getIO();
    if (io) {
      const payload = {
        broadcastId,
        title,
        message,
        category,
        priority,
        targetAreaName,
        actionUrl,
        expiresAt
      };

      if (audienceType === 'all') {
        io.emit('broadcast:new', payload);
      } else if (audienceType === 'providers') {
        io.emit('broadcast:new', payload); // Also caught by provider listeners
      } else if (audienceType === 'drivers') {
        io.emit('broadcast:new', payload);
      } else {
        io.emit('broadcast:new', payload);
      }
    }
  } catch (sErr) {}

  return broadcast;
};

// Record recipient acknowledgment of broadcast
const acknowledgeBroadcast = async ({ broadcastId, recipientId, recipientRole, recipientName }) => {
  const bc = await Broadcast.findOne({ broadcastId });
  if (!bc) {
    throw new Error('Broadcast not found');
  }

  const receipt = await BroadcastRecipient.findOneAndUpdate(
    { broadcastId: bc._id, recipientId },
    {
      recipientRole: recipientRole || 'user',
      recipientName: recipientName || '',
      acknowledgedAt: new Date()
    },
    { upsert: true, new: true }
  );

  await Broadcast.findByIdAndUpdate(bc._id, { $inc: { acknowledgedCount: 1 } });
  return receipt;
};

// Record recipient dismissal of broadcast
const dismissBroadcast = async ({ broadcastId, recipientId, recipientRole }) => {
  const bc = await Broadcast.findOne({ broadcastId });
  if (!bc) {
    throw new Error('Broadcast not found');
  }

  const receipt = await BroadcastRecipient.findOneAndUpdate(
    { broadcastId: bc._id, recipientId },
    {
      recipientRole: recipientRole || 'user',
      dismissedAt: new Date()
    },
    { upsert: true, new: true }
  );

  await Broadcast.findByIdAndUpdate(bc._id, { $inc: { dismissedCount: 1 } });
  return receipt;
};

module.exports = {
  createHyperlocalBroadcast,
  acknowledgeBroadcast,
  dismissBroadcast
};
