const paypal = require("@paypal/checkout-server-sdk");
const Order = require("../models/Order");
const sendEmail = require("../utils/sendEmail");

// PayPal client configuration
const environment = new paypal.core.LiveEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

async function verifyPaypalPayment(req, res) {
  const { orderId } = req.body;

  if (!orderId) {
    console.error("[Verify PayPal Payment] Missing orderId in request");
    return res.status(400).json({ error: "Order ID is required" });
  }

  console.log(`[Verify PayPal Payment] Processing order: ${orderId}`);

  try {
    // Capture the PayPal payment
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await paypalClient.execute(request);
    const captureData = capture.result.purchase_units[0].payments.captures[0];
    const captureId = captureData.id;
    const paymentStatus = captureData.status; // COMPLETED, PENDING, DENIED, etc.

    console.log(`[Verify PayPal Payment] PayPal status: ${paymentStatus}, Capture ID: ${captureId}`);

    // Update order in database
    const order = await Order.findOneAndUpdate(
      { orderId },
      {
        paymentId: captureId,
        paymentStatus:
          paymentStatus === "COMPLETED"
            ? "Success"
            : paymentStatus === "PENDING"
            ? "Pending"
            : "Failed",
        paymentTime: new Date(),
        paymentType: "PayPal",
      },
      { new: true }
    );

    if (!order) {
      console.error(`[Verify PayPal Payment] Order not found: ${orderId}`);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(`[Verify PayPal Payment] Order updated successfully:`, {
      orderId: order.orderId,
      paymentId: captureId,
      paymentTime: order.paymentTime,
      paymentStatus: order.paymentStatus,
    });

    if (paymentStatus === "COMPLETED") {
      // Payment completed immediately - send invoice
      try {
        console.log(`[Verify PayPal Payment] Sending emails for completed payment: ${orderId}`);

        // Send invoice email to customer (PDF will be auto-generated)
        if (order.email) {
          console.log(`[Verify PayPal Payment] Sending invoice email to customer: ${order.email}`);
          await sendEmail({
            to: order.email,
            subject: "Payment Confirmed - Your Invoice",
            template: "invoice",
            data: {
              ...order.toObject(),
              paymentType: "PayPal",
              deliveryTime: order.deliveryTime,
            },
            attachments: [], // Empty - PDF will be generated inside sendEmail
          });
          console.log(`[Verify PayPal Payment] Customer invoice email sent successfully`);
        }

        // Send notification email to admin (NO PDF)
        console.log(`[Verify PayPal Payment] Sending admin notification email`);
        await sendEmail({
          to: "genuineunlockerinfo@gmail.com",
          subject: "New Digital Service Order Received - PayPal",
          template: "newOrder",
          data: {
            ...order.toObject(),
            paymentType: "PayPal",
            deliveryTime: order.deliveryTime,
          },
          attachments: [], // No PDF for admin
        });
        console.log(`[Verify PayPal Payment] Admin notification email sent successfully`);

        res.json({
          status: "success",
          message: "PayPal payment verified and order updated successfully",
          orderId: order.orderId,
          paymentId: captureId,
          amount: order.amount,
          deliveryTime: order.deliveryTime,
        });
      } catch (emailErr) {
        console.error(`[Verify PayPal Payment] Email send error for order ${orderId}:`, {
          error: emailErr.message,
          stack: emailErr.stack,
        });

        res.json({
          status: "success",
          message: "PayPal payment verified successfully, but email notification failed",
          orderId: order.orderId,
          paymentId: captureId,
          amount: order.amount,
          deliveryTime: order.deliveryTime,
          emailError: emailErr.message,
        });
      }
    } else if (paymentStatus === "PENDING") {
      // Payment is pending - send pending notification
      console.log(`[Verify PayPal Payment] Payment pending for order: ${orderId}`);

      try {
        // Send pending payment email to customer
        if (order.email) {
          console.log(`[Verify PayPal Payment] Sending pending payment email to customer: ${order.email}`);
          await sendEmail({
            to: order.email,
            subject: "Payment Pending - We'll Process Once Cleared",
            template: "pendingPayment",
            data: {
              ...order.toObject(),
              paymentType: "PayPal",
              deliveryTime: order.deliveryTime,
            },
            attachments: [],
          });
        }

        // Send admin notification about pending payment
        console.log(`[Verify PayPal Payment] Sending admin notification for pending payment`);
        await sendEmail({
          to: "genuineunlockerinfo@gmail.com",
          subject: "PayPal Payment Pending - Order Awaiting Clearance",
          template: "newOrder",
          data: {
            ...order.toObject(),
            paymentType: "PayPal (PENDING)",
            paymentTime: "Payment Pending",
            deliveryTime: order.deliveryTime,
          },
          attachments: [],
        });

        res.json({
          status: "pending",
          message: "PayPal payment is pending clearance. Invoice will be sent automatically when payment clears.",
          orderId: order.orderId,
          expectedDelivery: order.deliveryTime,
        });
      } catch (emailErr) {
        console.error(`[Verify PayPal Payment] Pending email error for order ${orderId}:`, {
          error: emailErr.message,
          stack: emailErr.stack,
        });

        res.json({
          status: "pending",
          message: "PayPal payment is pending, but notification email failed",
          orderId: order.orderId,
          emailError: emailErr.message,
        });
      }
    } else {
      // Payment failed or denied
      console.warn(`[Verify PayPal Payment] Payment not completed. Status: ${paymentStatus} for order: ${orderId}`);

      res.status(400).json({
        error: "PayPal payment not completed",
        paymentStatus: paymentStatus,
        orderId: orderId,
      });
    }
  } catch (error) {
    console.error("[Verify PayPal Payment] PayPal API Error:", {
      orderId: orderId,
      message: error.message,
      statusCode: error.statusCode,
      details: error.result?.details || error,
      stack: error.stack,
    });

    // Update order status to failed
    try {
      await Order.findOneAndUpdate(
        { orderId },
        {
          paymentStatus: "Failed",
          paymentTime: new Date(),
        }
      );
      console.log(`[Verify PayPal Payment] Order marked as failed: ${orderId}`);
    } catch (dbError) {
      console.error(`[Verify PayPal Payment] Failed to update order status: ${dbError.message}`);
    }

    // Return appropriate error response
    if (error.statusCode === 422) {
      res.status(400).json({
        error: "Payment already captured or order already processed",
        orderId: orderId,
      });
    } else if (error.statusCode === 404) {
      res.status(404).json({
        error: "PayPal order not found",
        orderId: orderId,
      });
    } else {
      res.status(500).json({
        error: "Failed to verify PayPal payment",
        orderId: orderId,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = verifyPaypalPayment;