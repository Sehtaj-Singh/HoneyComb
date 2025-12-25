const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  weight: {
    type: String, // "250g", "500g", "1kg"
    required: true
  },

  mrp: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  discount: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
