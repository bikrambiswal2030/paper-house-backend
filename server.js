require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const brandRoutes = require("./routes/brands");
const productRoutes = require("./routes/products");
const itemRoutes = require("./routes/items");
const shareRoutes = require("./routes/share");
const uploadRoutes = require("./routes/uploads");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/products", productRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/share", shareRoutes); // public, no auth
app.use("/api/uploads", uploadRoutes);

app.get("/api/health", (req, res) => {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const state = mongoose.connection.readyState;
  res.json({ ok: state === 1, mongoState: states[state] });
});

const PORT = process.env.PORT || 5000;

mongoose.connection.on("connected", () => console.log("MongoDB: connected"));
mongoose.connection.on("disconnected", () => console.warn("MongoDB: disconnected"));
mongoose.connection.on("error", (err) => console.error("MongoDB error:", err.message));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  });
