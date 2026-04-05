const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ body: JSON.parse(body), statusCode: res.statusCode });
        } catch (e) {
          resolve({ body, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testFoodLog() {
  try {
    // 1. Login
    const loginRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'test2@example.com', password: 'password123' });

    const token = loginRes.body.token;
    console.log('Login OK');

    // 2. Add 'Rice' (should find it natively or fallback)
    const postRes1 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/foodlog',
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, { foodName: 'Rice' });
    console.log('POST Food (Rice):', JSON.stringify(postRes1.body));

    // 3. Add 'Apple'
    const postRes2 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/foodlog',
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, { foodName: 'Apple' });
    console.log('POST Food (Apple):', JSON.stringify(postRes2.body));

    // 4. GET Logs
    const getRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/foodlog',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('GET FoodLogs:', JSON.stringify(getRes.body));

    // 5. Delete Log
    if (postRes2.body && postRes2.body.id) {
       const delRes = await request({
         hostname: 'localhost',
         port: 5000,
         path: `/api/foodlog/${postRes2.body.id}`,
         method: 'DELETE',
         headers: { 'Authorization': `Bearer ${token}` }
       });
       console.log('DELETE FoodLog (Apple):', JSON.stringify(delRes.body));
    }

    process.exit(0);
  } catch (err) {
    console.error('Test Error:', err);
    process.exit(1);
  }
}

setTimeout(testFoodLog, 1500); // Wait for server to boot
