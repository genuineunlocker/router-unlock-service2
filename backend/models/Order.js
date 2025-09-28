const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  country: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  network: { type: String, required: true },
  imei: { type: String, required: true },
  serialNumber: { type: String, required: true },
  mobileNumber: { type: String },
  email: { type: String, required: true },
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
  deliveryTime: { type: String },
  termsAccepted: { type: Boolean, required: true }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);