const bcrypt = require('bcryptjs');
const User = require('../models/User');
const dotenv = require('dotenv');

module.exports = async function seed() {
  try {
    dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

    const accounts = [
      {
      username: process.env.ADMIN1_EMAIL,
      pass: process.env.ADMIN1_PASSWORD,
      role: 'admin',
      name: 'Admin One'
      },
      {
      username: process.env.ADMIN2_EMAIL,
      pass: process.env.ADMIN2_PASSWORD,
      role: 'admin',
      name: 'Admin Two'
      },
      {
      username: process.env.EMPLOYEE1_EMAIL,
      pass: process.env.EMPLOYEE1_PASSWORD,
      role: 'employee',
      name: 'Emp One'
      },
      {
      username: process.env.EMPLOYEE2_EMAIL,
      pass: process.env.EMPLOYEE2_PASSWORD,
      role: 'employee',
      name: 'Emp Two'
      }
    ];

    for (const acc of accounts) {
      if (!acc.username || !acc.pass) continue;
      const exists = await User.findOne({ username: acc.username });
      if (!exists) {
        await User.create({ username: acc.username, password: acc.pass, role: acc.role, name: acc.name, isApproved: true });
        console.log('Seeded user', acc.username);
      }
    }
  } catch (err) {
    console.error('Seeding error', err);
  }
};
