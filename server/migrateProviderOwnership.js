const mongoose = require('mongoose');

async function migrateData() {
  await mongoose.connect('mongodb://localhost:27017/tiffinlink');
  console.log('--- STARTING MULTI-PROVIDER OWNERSHIP MIGRATION ---');

  const db = mongoose.connection.db;

  // 1. Find primary provider (Mansuri Kitchen)
  const mansuriProvider = await db.collection('providers').findOne({ email: 'menxoxo50@gmail.com' });
  const mansuriUser = await db.collection('users').findOne({ email: 'menxoxo50@gmail.com' });

  // 2. Find test provider (Sahal Patel)
  const sahalProvider = await db.collection('providers').findOne({ email: 'sahal233patel@gmail.com' });
  const sahalUser = await db.collection('users').findOne({ email: 'sahal233patel@gmail.com' });

  if (mansuriProvider && mansuriUser) {
    await db.collection('providers').updateOne(
      { _id: mansuriProvider._id },
      { $set: { userId: mansuriUser._id } }
    );
    console.log(`✓ Linked Mansuri Kitchen provider (${mansuriProvider._id}) to user (${mansuriUser._id})`);
  }

  if (sahalProvider && sahalUser) {
    await db.collection('providers').updateOne(
      { _id: sahalProvider._id },
      { $set: { userId: sahalUser._id } }
    );
    console.log(`✓ Linked Sahal Patel provider (${sahalProvider._id}) to user (${sahalUser._id})`);
  }

  const primaryProviderId = mansuriProvider ? mansuriProvider._id.toString() : '6a7f3051d4b48741d8722416';

  // 3. Migrate Orders without providerId to primaryProviderId
  const orderRes = await db.collection('orders').updateMany(
    { $or: [{ providerId: { $exists: false } }, { providerId: null }, { providerId: '' }, { providerId: 'prov_1' }] },
    { $set: { providerId: primaryProviderId } }
  );
  console.log(`✓ Updated ${orderRes.modifiedCount} orders with providerId ${primaryProviderId}`);

  // 4. Migrate Tiffins without providerId to primaryProviderId
  const tiffinRes = await db.collection('tiffins').updateMany(
    { $or: [{ providerId: { $exists: false } }, { providerId: null }, { providerId: '' }, { providerId: 'prov_1' }] },
    { $set: { providerId: primaryProviderId } }
  );
  console.log(`✓ Updated ${tiffinRes.modifiedCount} tiffins with providerId ${primaryProviderId}`);

  // 5. Migrate Subscriptions
  const subRes = await db.collection('subscriptions').updateMany(
    { $or: [{ providerId: { $exists: false } }, { providerId: null }, { providerId: '' }, { providerId: 'prov_1' }] },
    { $set: { providerId: primaryProviderId } }
  );
  console.log(`✓ Updated ${subRes.modifiedCount} subscriptions with providerId ${primaryProviderId}`);

  // 6. Migrate Reviews
  const revRes = await db.collection('reviews').updateMany(
    { $or: [{ providerId: { $exists: false } }, { providerId: null }, { providerId: '' }, { providerId: 'prov_1' }] },
    { $set: { providerId: primaryProviderId } }
  );
  console.log(`✓ Updated ${revRes.modifiedCount} reviews with providerId ${primaryProviderId}`);

  // 7. Migrate DeliveryRequests
  const delRes = await db.collection('deliveryrequests').updateMany(
    { $or: [{ providerId: { $exists: false } }, { providerId: null }, { providerId: '' }, { providerId: 'prov_1' }] },
    { $set: { providerId: primaryProviderId } }
  );
  console.log(`✓ Updated ${delRes.modifiedCount} deliveryrequests with providerId ${primaryProviderId}`);

  // 8. Migrate KitchenCapacities
  const capRes = await db.collection('kitchencapacities').updateMany(
    { $or: [{ providerId: { $exists: false } }, { providerId: null }, { providerId: '' }, { providerId: 'prov_1' }] },
    { $set: { providerId: primaryProviderId } }
  );
  console.log(`✓ Updated ${capRes.modifiedCount} kitchencapacities with providerId ${primaryProviderId}`);

  // 9. Migrate KitchenSchedules safely
  const existingSched = await db.collection('kitchenschedules').findOne({ providerId: primaryProviderId });
  if (existingSched) {
    await db.collection('kitchenschedules').deleteMany({ providerId: 'prov_1' });
  } else {
    await db.collection('kitchenschedules').updateMany({ providerId: 'prov_1' }, { $set: { providerId: primaryProviderId } });
  }
  console.log(`✓ Handled kitchenschedules for ${primaryProviderId}`);

  // 10. Migrate ServiceAreas
  const areaRes = await db.collection('serviceareas').updateMany(
    { $or: [{ providerId: { $exists: false } }, { providerId: null }, { providerId: '' }, { providerId: 'prov_1' }] },
    { $set: { providerId: primaryProviderId } }
  );
  console.log(`✓ Updated ${areaRes.modifiedCount} serviceareas with providerId ${primaryProviderId}`);

  // 11. Migrate ProviderSettings safely
  const existingSetting = await db.collection('providersettings').findOne({ providerId: primaryProviderId });
  if (existingSetting) {
    await db.collection('providersettings').deleteMany({ providerId: 'prov_1' });
  } else {
    await db.collection('providersettings').updateMany({ providerId: 'prov_1' }, { $set: { providerId: primaryProviderId } });
  }
  console.log(`✓ Handled providersettings for ${primaryProviderId}`);

  // 12. Migrate Notifications (recipientId -> providerId)
  const notifRes = await db.collection('notifications').updateMany(
    { $or: [{ recipientId: { $exists: false } }, { recipientId: null }, { recipientId: '' }, { recipientId: 'provider_1' }] },
    { $set: { recipientId: primaryProviderId } }
  );
  console.log(`✓ Updated ${notifRes.modifiedCount} notifications with recipientId ${primaryProviderId}`);

  // 13. Migrate SupportTickets
  const tickRes = await db.collection('supporttickets').updateMany(
    { $or: [{ providerId: { $exists: false } }, { providerId: null }, { providerId: '' }, { providerId: 'prov_1' }] },
    { $set: { providerId: primaryProviderId } }
  );
  console.log(`✓ Updated ${tickRes.modifiedCount} supporttickets with providerId ${primaryProviderId}`);

  // 14. Migrate Payouts
  const payRes = await db.collection('payouts').updateMany(
    { $or: [{ providerId: { $exists: false } }, { providerId: null }, { providerId: '' }, { providerId: 'prov_1' }] },
    { $set: { providerId: primaryProviderId } }
  );
  console.log(`✓ Updated ${payRes.modifiedCount} payouts with providerId ${primaryProviderId}`);

  console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
  await mongoose.disconnect();
}

migrateData().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
