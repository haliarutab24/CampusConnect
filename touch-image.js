const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'public', 'premium-avatar.png');
const data = fs.readFileSync(src);
fs.writeFileSync(src, data);
console.log('File touched successfully');
