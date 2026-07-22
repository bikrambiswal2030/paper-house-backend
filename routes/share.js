const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Brand = require("../models/Brand");
const Item = require("../models/Item");

const router = express.Router();

function itemPublicShape(item) {
  return {
    id: item._id,
    shareId: item.shareId,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    images: item.images,
    brand: item.brand ? { id: item.brand._id, name: item.brand.name } : null,
    mrp: item.mrp,
    discountPercent: item.discountPercent,
    sellingPrice: item.sellingPrice,
    quantity: item.quantity,
  };
}

// GET /api/share/product/:shareId
// Product landing page: total quantity + brand-wise breakdown
router.get("/product/:shareId", async (req, res) => {
  const product = await Product.findOne({ shareId: req.params.shareId }).populate("brands", "name");
  if (!product) return res.status(404).json({ error: "This link is no longer valid." });

  const items = await Item.find({ products: product._id }).populate("brand", "name");

  const brandMap = new Map();
  // Seed with brands explicitly linked to this product, even if they have no items yet
  for (const b of product.brands) {
    brandMap.set(String(b._id), { id: b._id, name: b.name, quantity: 0, itemCount: 0 });
  }

  let totalQuantity = 0;
  for (const item of items) {
    totalQuantity += item.quantity;
    if (!item.brand) continue;
    const key = String(item.brand._id);
    if (!brandMap.has(key)) {
      brandMap.set(key, { id: item.brand._id, name: item.brand.name, quantity: 0, itemCount: 0 });
    }
    const entry = brandMap.get(key);
    entry.quantity += item.quantity;
    entry.itemCount += 1;
  }

  res.json({
    product: { id: product._id, name: product.name, shareId: product.shareId },
    totalQuantity,
    brands: Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
  });
});

// GET /api/share/product/:shareId/brand/:brandId
// Drill-down from a product page into one brand's items within that product
router.get("/product/:shareId/brand/:brandId", async (req, res) => {
  const { shareId, brandId } = req.params;
  if (!mongoose.isValidObjectId(brandId)) return res.status(400).json({ error: "Invalid brand." });

  const product = await Product.findOne({ shareId });
  if (!product) return res.status(404).json({ error: "This link is no longer valid." });

  const brand = await Brand.findById(brandId);
  if (!brand) return res.status(404).json({ error: "Brand not found." });

  const items = await Item.find({ products: product._id, brand: brand._id }).populate("brand", "name");

  res.json({
    product: { id: product._id, name: product.name, shareId: product.shareId },
    brand: { id: brand._id, name: brand.name },
    items: items.map(itemPublicShape),
  });
});

// GET /api/share/brand/:shareId
// Brand landing page: all items carrying this brand, across all products
router.get("/brand/:shareId", async (req, res) => {
  const brand = await Brand.findOne({ shareId: req.params.shareId });
  if (!brand) return res.status(404).json({ error: "This link is no longer valid." });

  const items = await Item.find({ brand: brand._id }).populate("brand", "name");

  res.json({
    brand: { id: brand._id, name: brand.name, shareId: brand.shareId },
    items: items.map(itemPublicShape),
  });
});

// GET /api/share/item/:shareId
// Single item detail page
router.get("/item/:shareId", async (req, res) => {
  const item = await Item.findOne({ shareId: req.params.shareId }).populate("brand", "name").populate("products", "name");
  if (!item) return res.status(404).json({ error: "This link is no longer valid." });

  res.json({
    id: item._id,
    shareId: item.shareId,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    images: item.images,
    brand: item.brand ? { id: item.brand._id, name: item.brand.name } : null,
    products: item.products.map((p) => ({ id: p._id, name: p.name })),
    mrp: item.mrp,
    discountPercent: item.discountPercent,
    sellingPrice: item.sellingPrice,
    quantity: item.quantity,
  });
});

module.exports = router;