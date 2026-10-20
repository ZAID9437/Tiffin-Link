const FraudAlert = require('../models/FraudAlert');
const RiskEvent = require('../models/RiskEvent');
const Order = require('../models/Order');
const { getIO } = require('./socketService');

// Evaluate risk signals for an order placement or lifecycle event
const evaluateOrderRisk = async ({
  orderId,
  userId,
  userEmail,
  totalAmount,
  paymentStatus,
  actionType = 'order_placement'
}) => {
  const now = new Date();
  const window30m = new Date(now.getTime() - 30 * 60 * 1000);
  const window60m = new Date(now.getTime() - 60 * 60 * 1000);

  let accumulatedRiskPoints = 0;
  const detectedSignals = [];

  // 1. Rapid cancellation check
  if (actionType === 'order_cancellation' && userId) {
    const recentCancellations = await Order.countDocuments({
      customerId: userId,
      status: { $in: ['CANCELLED', 'Cancelled'] },
      createdAt: { $gte: window30m }
    });

    if (recentCancellations >= 2) {
      accumulatedRiskPoints += 35;
      detectedSignals.push({
        type: 'cancellation_velocity',
        message: `User cancelled ${recentCancellations} orders within the last 30 minutes.`
      });

      await new RiskEvent({
        eventType: 'cancellation_velocity',
        userId,
        userEmail,
        severity: 'high',
        riskPoints: 35,
        resourceType: 'order',
        resourceId: orderId,
        payload: { recentCancellations }
      }).save();
    }
  }

  // 2. High order velocity (Too many orders in 1 hour)
  if (userId) {
    const recentOrdersCount = await Order.countDocuments({
      customerId: userId,
      createdAt: { $gte: window60m }
    });

    if (recentOrdersCount >= 4) {
      accumulatedRiskPoints += 30;
      detectedSignals.push({
        type: 'order_frequency_spike',
        message: `High velocity: ${recentOrdersCount} orders placed in 60 minutes.`
      });

      await new RiskEvent({
        eventType: 'order_frequency_spike',
        userId,
        userEmail,
        severity: 'medium',
        riskPoints: 30,
        resourceType: 'order',
        resourceId: orderId,
        payload: { recentOrdersCount }
      }).save();
    }
  }

  // 3. Unusually high single order value (Above 4000 INR)
  if (totalAmount && Number(totalAmount) > 4000) {
    accumulatedRiskPoints += 25;
    detectedSignals.push({
      type: 'unusual_high_value_order',
      message: `Unusually large transaction value: ₹${totalAmount}.`
    });

    await new RiskEvent({
      eventType: 'unusual_high_value_order',
      userId,
      userEmail,
      severity: 'medium',
      riskPoints: 25,
      resourceType: 'order',
      resourceId: orderId,
      payload: { totalAmount }
    }).save();
  }

  // 4. Payment failures
  if (paymentStatus === 'FAILED' || paymentStatus === 'PAYMENT_FAILED') {
    accumulatedRiskPoints += 20;
    detectedSignals.push({
      type: 'payment_failure_burst',
      message: 'Failed payment authorization attempted.'
    });
  }

  // If risk points exceed threshold, raise a FraudAlert
  if (accumulatedRiskPoints >= 45) {
    const severity = accumulatedRiskPoints >= 70 ? 'critical' : (accumulatedRiskPoints >= 55 ? 'high' : 'medium');
    const alertId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;

    const alert = new FraudAlert({
      alertId,
      ruleId: detectedSignals[0]?.type || 'MULTIPLE_RISK_SIGNALS',
      ruleName: detectedSignals.map(s => s.type).join(' + '),
      severity,
      status: 'open',
      riskScore: Math.min(100, accumulatedRiskPoints),
      reasonCode: detectedSignals[0]?.type || 'SUSPICIOUS_ACTIVITY',
      summary: detectedSignals.map(s => s.message).join(' | '),
      resourceType: 'order',
      resourceId: orderId,
      userId: userId || 'GUEST',
      userEmail: userEmail || 'unknown@user.com',
      evidence: {
        totalAmount,
        signals: detectedSignals,
        evaluatedAt: now
      },
      auditTrail: [{
        action: 'ALERT_TRIGGERED',
        performedBy: 'SYSTEM_RISK_ENGINE',
        timestamp: now,
        note: `Generated automatically with score ${accumulatedRiskPoints}`
      }]
    });

    await alert.save();

    // Broadcast to Admin Room via Socket.IO
    try {
      const io = getIO();
      if (io) {
        io.emit('fraud:alert_raised', {
          alertId,
          ruleName: alert.ruleName,
          severity,
          riskScore: alert.riskScore,
          summary: alert.summary,
          orderId
        });
      }
    } catch (sErr) {}

    return { isRisky: true, riskScore: accumulatedRiskPoints, alert };
  }

  return { isRisky: false, riskScore: accumulatedRiskPoints, detectedSignals };
};

// Admin updates fraud alert status
const resolveFraudAlert = async ({
  alertId,
  adminUserId,
  adminUserName,
  status,
  resolutionAction,
  resolutionNotes
}) => {
  const alert = await FraudAlert.findOne({ alertId });
  if (!alert) {
    throw new Error('Fraud alert not found');
  }

  const previousState = alert.status;
  alert.status = status;
  if (resolutionAction) alert.resolutionAction = resolutionAction;
  if (resolutionNotes) alert.resolutionNotes = resolutionNotes;
  if (status === 'resolved' || status === 'dismissed') {
    alert.resolvedAt = new Date();
  }

  alert.auditTrail.push({
    action: `STATUS_CHANGE_${status.toUpperCase()}`,
    performedBy: adminUserName || adminUserId || 'Admin',
    timestamp: new Date(),
    note: resolutionNotes || '',
    previousState,
    newState: status
  });

  await alert.save();

  // Socket notification
  try {
    const io = getIO();
    if (io) {
      io.emit('fraud:alert_updated', {
        alertId,
        status,
        resolutionAction
      });
    }
  } catch (sErr) {}

  return alert;
};

module.exports = {
  evaluateOrderRisk,
  resolveFraudAlert
};
