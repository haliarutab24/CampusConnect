const http = require('http');

http.get('http://localhost:3000/api/auth/session', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Body (first 500 chars):', data.substring(0, 500));
  });
}).on('error', (err) => {
  console.error('Error connecting to dev server:', err.message);
});
