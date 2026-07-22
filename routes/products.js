const express = require("express");
const Product = require("../models/Product");
const Brand = require("../models/Brand");
const Item = require("../models/Item");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// List all products
router.get("/", async (req, res) => {
  const products = await Product.find().sort({ name: 1 });
  res.json(products);
});

// Get one product, with its linked brands + quantity/item-count for each
router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id).populate("brands", "name shareId");
  if (!product) return res.status(404).json({ error: "Product not found." });

  const items = await Item.find({ products: product._id });
  const statsByBrand = new Map();
  for (const item of items) {
    const key = String(item.brand);
    const entry = statsByBrand.get(key) || { quantity: 0, itemCount: 0 };
    entry.quantity += item.quantity;
    entry.itemCount += 1;
    statsByBrand.set(key, entry);
  }

  const brands = product.brands.map((b) => {
    const stats = statsByBrand.get(String(b._id)) || { quantity: 0, itemCount: 0 };
    return { id: b._id, name: b.name, shareId: b.shareId, quantity: stats.quantity, itemCount: stats.itemCount };
  });

  res.json({
    id: product._id,
    name: product.name,
    shareId: product.shareId,
    brands,
  });
});

// Create a product
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Product name is required." });
    const product = await Product.create({ name: name.trim() });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "That product already exists." });
    res.status(500).json({ error: "Could not create product." });
  }
});

// Update a product
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name: name?.trim() },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found." });
    res.json(product);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "That product already exists." });
    res.status(500).json({ error: "Could not update product." });
  }
});

// Link a brand to this product — pass an existing brandId, or a name to create a new brand on the fly
router.post("/:id/brands", async (req, res) => {
  try {
    const { brandId, name } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found." });

    let brand;
    if (brandId) {
      brand = await Brand.findById(brandId);
      if (!brand) return res.status(404).json({ error: "Brand not found." });
    } else if (name && name.trim()) {
      const trimmed = name.trim();
      brand = await Brand.findOne({ name: new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
      if (!brand) brand = await Brand.create({ name: trimmed });
    } else {
      return res.status(400).json({ error: "Select an existing brand or enter a name for a new one." });
    }

    const alreadyLinked = product.brands.some((b) => String(b) === String(brand._id));
    if (!alreadyLinked) {
      product.brands.push(brand._id);
      await product.save();
    }

    res.status(201).json({ id: brand._id, name: brand.name, quantity: 0, itemCount: 0 });
  } catch (err) {
    res.status(500).json({ error: "Could not link brand to product." });
  }
});

// Unlink a brand from this product (blocked if items still exist under that combination)
router.delete("/:id/brands/:brandId", async (req, res) => {
  const inUse = await Item.exists({ products: req.params.id, brand: req.params.brandId });
  if (inUse) {
    return res.status(409).json({ error: "This brand still has items under this product. Remove those items first." });
  }
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });
  product.brands = product.brands.filter((b) => String(b) !== req.params.brandId);
  await product.save();
  res.json({ ok: true });
});

// Items for one brand within this product — powers the "Add item" drill-down screen
router.get("/:id/brands/:brandId/items", async (req, res) => {
  const items = await Item.find({ products: req.params.id, brand: req.params.brandId })
    .populate("brand", "name")
    .populate("products", "name")
    .sort({ createdAt: -1 });
  res.json(items);
});

// Delete a product (blocked if items still reference it)
router.delete("/:id", async (req, res) => {
  const inUse = await Item.exists({ products: req.params.id });
  if (inUse) {
    return res.status(409).json({ error: "This product still has items linked to it. Remove or reassign those items first." });
  }
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json({ ok: true });
});

module.exports = router;
