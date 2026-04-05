const fs = require('fs');
const http = require('http');
const path = require('path');

async function uploadFile() {
  const filePath = 'c:\\Users\\sowmy\\OneDrive\\Documents\\Desktop\\NUTRI AI\\robust_nutrition_test.csv';

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const filename = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);

  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
  body += 'Content-Type: text/csv\r\n\r\n';
  
  const header = Buffer.from(body);
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  const totalLength = header.length + fileContent.length + footer.length;

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/nutrition/upload',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': totalLength
    }
  };

  const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
      console.log('Response:', responseBody);
      process.exit(res.statusCode === 200 ? 0 : 1);
    });
  });

  req.on('error', (e) => {
    console.error('Problem with request:', e.message);
    process.exit(1);
  });

  req.write(header);
  req.write(fileContent);
  req.write(footer);
  req.end();
}

uploadFile();
