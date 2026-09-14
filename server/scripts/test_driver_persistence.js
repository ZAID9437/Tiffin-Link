const http = require('http');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testDriverPersistence() {
  try {
    console.log('Testing GET /api/delivery/driver-dashboard for authentic drivers...');

    // 1. Query for Ziyan Mansuri driver
    const json1 = await httpGet('http://localhost:5000/api/delivery/driver-dashboard?email=zaidmansuri3654@gmail.com');
    console.log('\n--- DRIVER DASHBOARD RESPONSE FOR ZIYAN MANSHURI ---');
    console.log('Success:', json1.success);
    console.log('Driver Info:', json1.data?.driver);
    console.log('Active Delivery ID:', json1.data?.activeDelivery?._id || json1.data?.activeDelivery?.requestId || 'None');
    if (json1.data?.activeDelivery) {
      console.log('  - Driver Name:', json1.data.activeDelivery.assignedDriver?.name);
      console.log('  - Provider Kitchen Name:', json1.data.activeDelivery.providerName);
      console.log('  - Customer Name:', json1.data.activeDelivery.customerName);
    }

    // 2. Query for Ramesh Patel driver
    const json2 = await httpGet('http://localhost:5000/api/delivery/driver-dashboard?email=ramesh.patel@gmail.com');
    console.log('\n--- DRIVER DASHBOARD RESPONSE FOR RAMESH PATEL ---');
    console.log('Success:', json2.success);
    console.log('Driver Info:', json2.data?.driver);
    console.log('Active Delivery ID:', json2.data?.activeDelivery?._id || json2.data?.activeDelivery?.requestId || 'None');

    console.log('\nTest Completed Successfully.');
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
}

testDriverPersistence();
