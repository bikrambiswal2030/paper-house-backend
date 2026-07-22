const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Parker Vector"
    description: { type: String, trim: true, default: "" },
    imageUrl: { type: String, default: "" }, // legacy single photo, kept in sync with images[0]
    images: { type: [String], default: [] }, // ordered gallery; images[0] is the cover photo

    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    // An item can belong to more than one product category (kept flexible on purpose)
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }],

    mrp: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    sellingPrice: { type: Number, required: true, min: 0 }, // auto-derived, but stored for fast reads

    quantity: { type: Number, required: true, min: 0, default: 0 },

    shareId: { type: String, required: true, unique: true, default: () => nanoid(8) },
  },
  { timestamps: true }
);

// Keep sellingPrice consistent with mrp + discountPercent whenever those change
// and no explicit sellingPrice override was sent in the same update.
ItemSchema.pre("validate", function (next) {
  if (this.isModified("mrp") || this.isModified("discountPercent")) {
    if (!this.isModified("sellingPrice")) {
      const computed = this.mrp - (this.mrp * this.discountPercent) / 100;
      this.sellingPrice = Math.round(computed * 100) / 100;
    }
  }

  // Keep the legacy single imageUrl in sync with the images gallery so any
  // older code path that still reads imageUrl (e.g. a public share page)
  // keeps showing the cover photo.
  if (this.isModified("images")) {
    this.imageUrl = this.images && this.images.length ? this.images[0] : "";
  } else if (this.isModified("imageUrl") && (!this.images || this.images.length === 0)) {
    this.images = this.imageUrl ? [this.imageUrl] : [];
  }

  next();
});

ItemSchema.index({ brand: 1 });
ItemSchema.index({ products: 1 });

module.exports = mongoose.model("Item", ItemSchema);