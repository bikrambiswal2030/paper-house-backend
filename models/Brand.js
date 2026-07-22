const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    shareId: { type: String, required: true, unique: true, default: () => nanoid(8) },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", BrandSchema);
