const http = require('http');

const postData = JSON.stringify({
  email: 'test@test.com',
  password: 'password',
  redirect: 'false',
  csrfToken: 'dummy' // In credentials auth, csrfToken is required by next-auth unless bypassed or fetched first
});

// First, let's get the CSRF token
http.get('http://localhost:3000/api/auth/csrf', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('CSRF response:', body);
    let csrfToken = '';
    try {
      csrfToken = JSON.parse(body).csrfToken;
    } catch(e) {}
    
    // Now, perform signin
    const signinData = new URLSearchParams({
      email: 'test@test.com',
      password: 'password',
      redirect: 'false',
      csrfToken: csrfToken,
      callbackUrl: 'http://localhost:3000'
    }).toString();
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(signinData)
      }
    }, (res2) => {
      console.log('Signin Status Code:', res2.statusCode);
      console.log('Signin Headers:', res2.headers);
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => {
        console.log('Signin Body:', body2.substring(0, 1000));
      });
    });
    
    req.write(signinData);
    req.end();
  });
});
