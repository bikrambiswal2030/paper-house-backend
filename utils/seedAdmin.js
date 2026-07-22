require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error("Set ADMIN_USERNAME and ADMIN_PASSWORD in .env first.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await Admin.findOne({ username });
  if (existing) {
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Updated password for admin "${username}".`);
  } else {
    await Admin.create({ username, passwordHash });
    console.log(`Created admin "${username}".`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
