require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

const ACCOUNTS = [
  {
    username: 'superadmin',
    email: 'admin@cexio.com',
    password: 'Admin@1234',
    role: 'admin',
  },
  {
    username: 'agent01',
    email: 'agent@cexio.com',
    password: 'Agent@1234',
    role: 'agent',
  },
];

async function createAccounts() {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    for (const acc of ACCOUNTS) {
      const existing = await User.findOne({ email: acc.email });
      if (existing) {
        console.log(`[SKIP] ${acc.role} already exists: ${acc.email}`);
        continue;
      }
      const user = new User(acc);
      await user.save();
      console.log(`[OK] Created ${acc.role}:`);
      console.log(`     Username : ${acc.username}`);
      console.log(`     Email    : ${acc.email}`);
      console.log(`     Password : ${acc.password}`);
      console.log(`     Role     : ${acc.role}\n`);
    }

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAccounts();
