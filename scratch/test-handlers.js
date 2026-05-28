try {
  const authConfig = require('../lib/auth');
  console.log('Keys in authConfig:', Object.keys(authConfig));
  console.log('handlers:', authConfig.handlers);
} catch (err) {
  console.error('Error importing auth config:', err.stack);
}
