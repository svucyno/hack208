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

async function test() {
  try {
    // 1. Login
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

    // 2. Update Profile (using values from user screenshot)
    const profileData = {
      age: 20,
      weight: 60.2,
      height: 154,
      gender: 'female',
      goal: 'maintenance',
      dietaryPreference: 'veg',
      allergies: 'Brinjal'
    };

    console.log('Updating profile with:', JSON.stringify(profileData));
    const profileRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/profile',
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, profileData);

    console.log('Profile update response:', profileRes.statusCode, JSON.stringify(profileRes.body, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  }
}

test();
