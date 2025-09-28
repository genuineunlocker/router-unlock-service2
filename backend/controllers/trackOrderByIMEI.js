const Order = require("../models/Order");

async function trackOrderByIMEI(req, res) {
  try {
    const imei = req.params.imei;
    if (!imei) return res.status(400).json({ error: "IMEI is required" });

    const orders = await Order.find({ imei });
    if (!orders?.length)
      return res.status(404).json({ error: "No orders found for this IMEI" });

    res.json(
      orders.map((order) => ({
        ...order.toObject(),
        paymentTime: order.paymentTime
          ? order.paymentTime.toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Riyadh",
            })
          : null,
      }))
    );
  } catch (error) {
    console.error("Track Order Error:", error.message);
    res.status(500).json({ error: "Failed to track order" });
  }
}

module.exports = trackOrderByIMEI;