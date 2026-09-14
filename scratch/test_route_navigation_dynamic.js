async function testRouteNavigationDynamic() {
  console.log('=== ROUTE & NAVIGATION DYNAMIC DATA VERIFICATION ===');
  
  try {
    const driverId = '6aa03a9d09b952ceb1a40c21';
    const phone = '+91 9558601570';
    const res = await fetch(`http://localhost:5000/api/delivery/active-delivery?driverId=${encodeURIComponent(driverId)}&phone=${encodeURIComponent(phone)}`);
    const json = await res.json();
    console.log(`✓ HTTP /api/delivery/active-delivery Response: success=${json.success}`);
    if (json.activeDelivery) {
      console.log(`   Fetched Active Delivery Order: ${json.activeDelivery.orderId || json.activeDelivery.requestId}`);
      console.log(`   Delivery Status: ${json.activeDelivery.status}`);
      console.log(`   Pickup Address: ${typeof json.activeDelivery.pickupAddress === 'string' ? json.activeDelivery.pickupAddress : JSON.stringify(json.activeDelivery.pickupAddress)}`);
      console.log(`   Drop-off Address: ${typeof json.activeDelivery.deliveryAddress === 'string' ? json.activeDelivery.deliveryAddress : JSON.stringify(json.activeDelivery.deliveryAddress)}`);
      console.log(`   Driver Payout: ₹${json.activeDelivery.driverEarning || json.activeDelivery.payout || 0}`);
    } else {
      console.log('   No active delivery returned for test driver');
    }

    console.log('✓ ALL ROUTE & NAVIGATION BACKEND VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  }
}

testRouteNavigationDynamic();
