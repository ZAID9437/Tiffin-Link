async function testCustomerHandoverOtpFlow() {
  console.log('=== CUSTOMER HANDOVER OTP FLOW VERIFICATION ===');
  
  try {
    // Active delivery ID for driver Ziyan Mansuri (Order #ORD-8569)
    const deliveryId = '#ORD-8569';
    const driverId = '6aa03a9d09b952ceb1a40c21';

    console.log(`1. Testing POST /api/delivery/customer-handover-otp/send for delivery ${deliveryId}...`);
    const sendRes = await fetch('http://localhost:5000/api/delivery/customer-handover-otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveryId,
        driverId
      })
    });

    const sendJson = await sendRes.json();
    console.log(`✓ Send Response Status: ${sendRes.status}`);
    console.log(`✓ Send Response JSON:`, sendJson);

    // Verify security: OTP must NOT be returned in JSON
    if (sendJson.otp || sendJson.code || sendJson.demoOtp) {
      throw new Error('❌ SECURITY VIOLATION: OTP code was exposed in backend JSON response!');
    } else {
      console.log('✓ SECURITY CHECK PASSED: Plaintext OTP is NOT exposed in response JSON.');
    }

    if (!sendJson.success) {
      console.log(`ℹ️ Delivery status notice: ${sendJson.message}`);
      return;
    }

    console.log(`✓ Masked Customer Phone: ${sendJson.maskedPhone}`);
    console.log(`✓ Customer Name: ${sendJson.customerName}`);

    // 2. Test Invalid OTP Code verification
    console.log('\n2. Testing POST /api/delivery/customer-handover-otp/verify with WRONG code (000000)...');
    const wrongRes = await fetch('http://localhost:5000/api/delivery/customer-handover-otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveryId,
        driverId,
        code: '000000'
      })
    });

    const wrongJson = await wrongRes.json();
    console.log(`✓ Invalid OTP Response Status: ${wrongRes.status}`);
    console.log(`✓ Invalid OTP Response Message: ${wrongJson.message}`);
    if (wrongRes.status === 200 && wrongJson.success && !wrongJson.alreadyCompleted) {
      throw new Error('❌ ERROR: Invalid OTP was wrongly approved!');
    } else {
      console.log('✓ INVALID OTP CHECK PASSED: Invalid OTP was correctly rejected.');
    }

    console.log('\n=== ALL CUSTOMER HANDOVER OTP VERIFICATIONS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testCustomerHandoverOtpFlow();
