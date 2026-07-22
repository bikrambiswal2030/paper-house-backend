const express = require("express");
const { upload } = require("../middleware/upload");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.post("/", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || "Could not upload image." });
    if (!req.file) return res.status(400).json({ error: "No image file received." });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

module.exports = router;
