const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quantity: { type: Number, default: 1 },
  total: { type: Number, required: true },
  razorpay_payment_id: { type: String, required: true },
  razorpay_order_id: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  // 🆕 NEW FIELD: track who cancelled the order
  cancelledBy: {
    type: String,
    enum: ["user", "admin", null],
    default: null,
  },
  trackingUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  items: [orderItemSchema],
});

module.exports = mongoose.model("Order", orderSchema);
