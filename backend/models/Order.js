const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  country: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  network: { type: String, required: true },
  imei: { type: String, required: true },
  serialNumber: { type: String, required: true },

  // Customer contact
  mobileNumber: { type: String },
  email: { type: String, required: true },

  // Payment details
  amount: { type: Number, required: true },
  orderId: { type: String, required: true }, // PayPal orderId
  paymentId: { type: String },               // PayPal captureId
  paymentStatus: {
    type: String,
    enum: ["Pending", "Success", "Failed"],
    default: "Pending",
  },
  paymentTime: { type: Date },
  paymentType: { type: String, enum: ["PayPal"], default: "PayPal" },

  // Service delivery info (digital service doesn’t need shipping/tracking)
  deliveryTime: { type: String }, // e.g., "1-2 hours", "24 hours"

  // Audit
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
