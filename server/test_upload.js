const http = require('http');
const fs = require('fs');
const path = require('path');

function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const filename = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    const pre = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: text/csv\r\n\r\n`
    );
    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([pre, fileData, post]);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/nutrition/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const files = [
    path.join(__dirname, '../sample_nutrition.csv'),
    path.join(__dirname, '../robust_nutrition_test.csv'),
  ];

  for (const f of files) {
    console.log(`\n📤 Uploading: ${path.basename(f)}`);
    try {
      const result = await uploadFile(f);
      console.log(`   Status: ${result.status}`);
      console.log(`   Response: ${result.body}`);
    } catch (e) {
      console.error(`   ERROR: ${e.message}`);
    }
  }
}

main();
