const express = require("express");
const Item = require("../models/Item");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// List all items (with brand/product names populated)
router.get("/", async (req, res) => {
  const items = await Item.find()
    .populate("brand", "name")
    .populate("products", "name")
    .sort({ createdAt: -1 });
  res.json(items);
});

// Get a single item
router.get("/:id", async (req, res) => {
  const item = await Item.findById(req.params.id).populate("brand", "name").populate("products", "name");
  if (!item) return res.status(404).json({ error: "Item not found." });
  res.json(item);
});

// Create an item
router.post("/", async (req, res) => {
  try {
    const { name, description, imageUrl, images, brand, products, mrp, discountPercent, sellingPrice, quantity } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: "Item name is required." });
    if (!brand) return res.status(400).json({ error: "Select a brand for this item." });
    if (!products || !products.length) return res.status(400).json({ error: "Select at least one product category." });
    if (mrp === undefined || mrp === null || mrp === "") return res.status(400).json({ error: "MRP is required." });

    const item = await Item.create({
      name: name.trim(),
      description: description?.trim() || "",
      imageUrl: imageUrl || "",
      images: Array.isArray(images) ? images : [],
      brand,
      products,
      mrp,
      discountPercent: discountPercent || 0,
      sellingPrice, // pre-validate hook fills this in if not explicitly set
      quantity: quantity ?? 0,
    });

    const populated = await item.populate([{ path: "brand", select: "name" }, { path: "products", select: "name" }]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: "Could not create item." });
  }
});

// Update an item
router.put("/:id", async (req, res) => {
  try {
    const { name, description, imageUrl, images, brand, products, mrp, discountPercent, sellingPrice, quantity } = req.body;

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found." });

    if (name !== undefined) item.name = name.trim();
    if (description !== undefined) item.description = description.trim();
    if (imageUrl !== undefined) item.imageUrl = imageUrl;
    if (images !== undefined) item.images = Array.isArray(images) ? images : [];
    if (brand !== undefined) item.brand = brand;
    if (products !== undefined) item.products = products;
    if (mrp !== undefined) item.mrp = mrp;
    if (discountPercent !== undefined) item.discountPercent = discountPercent;
    if (sellingPrice !== undefined) item.sellingPrice = sellingPrice;
    if (quantity !== undefined) item.quantity = quantity;

    await item.save();
    const populated = await item.populate([{ path: "brand", select: "name" }, { path: "products", select: "name" }]);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: "Could not update item." });
  }
});

// Delete an item
router.delete("/:id", async (req, res) => {
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found." });
  res.json({ ok: true });
});

module.exports = router;