const connectDB = require('../lib/db').default;
const User = require('../lib/models/User').default;

async function run() {
  try {
    await connectDB();
    console.log('Connected to DB');
    const users = await User.find({}, 'name email role');
    console.log('Users in DB:');
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) - Role: ${u.role}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
