const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ body: JSON.parse(body), statusCode: res.statusCode }));
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  try {
    // Login
    const loginRes = await request({
      hostname: 'localhost',
      port: 5000,

      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'test2@example.com', password: 'password123' });

    if (loginRes.statusCode !== 200) throw new Error('Login failed: ' + JSON.stringify(loginRes.body));
    const token = loginRes.body.token;
    console.log('Login successful');

    // Get Diet Plan
    const dietRes = await request({
      hostname: 'localhost',
      port: 5000,

      path: '/api/diet/plan',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Diet plan received:', JSON.stringify(dietRes.body, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

test();
