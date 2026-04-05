const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'client', 'src', 'components');

const files = fs.readdirSync(componentsDir);

files.forEach(file => {
  if (file.endsWith('.jsx')) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace both single and double-quoted occurrences
    content = content.replace(/'#2ecc71'/g, "'var(--primary)'");
    content = content.replace(/"#2ecc71"/g, '"var(--primary)"');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Replaced hex colors in ${file}`);
  }
});
