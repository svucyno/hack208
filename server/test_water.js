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

async function testWater() {
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

    // 2. Fetch Water (should initialize to 0)
    const getRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/water',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('GET Water:', JSON.stringify(getRes.body));

    // 3. Add Water (+250)
    const postRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/water',
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, { amountToAdd: 250 });
    console.log('POST Water (+250):', JSON.stringify(postRes.body));
    process.exit(0);
  } catch (err) {
    console.error('Test Error:', err);
    process.exit(1);
  }
}

testWater();
