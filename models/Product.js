const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    shareId: { type: String, required: true, unique: true, default: () => nanoid(8) },
    // Brands linked to this product, e.g. Pen -> [Parker, Cello].
    // Linking happens explicitly from the admin panel, before items necessarily exist.
    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
