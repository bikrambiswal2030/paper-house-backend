const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }

    const token = jwt.sign({ sub: admin._id, username: admin.username }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, username: admin.username });
  } catch (err) {
    res.status(500).json({ error: "Sign in failed. Try again." });
  }
});

module.exports = router;
