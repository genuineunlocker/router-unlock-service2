const Order = require("../models/Order");

async function getOrderDetails(req, res) {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const formattedPaymentTime = order.paymentTime
      ? order.paymentTime.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Riyadh",
        })
      : null;

    res.json({
      ...order.toObject(),
      paymentTime: formattedPaymentTime,
    });
  } catch (error) {
    console.error("Fetch Order Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = getOrderDetails;