const express = require("express");
const Brand = require("../models/Brand");
const Item = require("../models/Item");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// List all brands
router.get("/", async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 });
  res.json(brands);
});

// Create a brand
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Brand name is required." });
    const brand = await Brand.create({ name: name.trim() });
    res.status(201).json(brand);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "That brand already exists." });
    res.status(500).json({ error: "Could not create brand." });
  }
});

// Update a brand
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { name: name?.trim() },
      { new: true, runValidators: true }
    );
    if (!brand) return res.status(404).json({ error: "Brand not found." });
    res.json(brand);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "That brand already exists." });
    res.status(500).json({ error: "Could not update brand." });
  }
});

// Delete a brand (blocked if items still reference it)
router.delete("/:id", async (req, res) => {
  const inUse = await Item.exists({ brand: req.params.id });
  if (inUse) {
    return res.status(409).json({ error: "This brand still has items linked to it. Remove or reassign those items first." });
  }
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) return res.status(404).json({ error: "Brand not found." });
  res.json({ ok: true });
});

module.exports = router;
