const Order = require("../models/Order");
const sendEmail = require("../utils/sendEmail");
const generateInvoicePDF = require("../utils/generateInvoicePDF");

async function paypalWebhook(req, res) {
  try {
    const event = req.body;

    console.log("[PayPal Webhook] Event received:", {
      eventType: event.event_type,
      eventId: event.id,
      timestamp: new Date().toISOString()
    });

    // Handle only completed captures
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = event.resource;
      const captureId = capture.id;
      const orderId = capture.supplementary_data?.related_ids?.order_id || capture.custom_id;;

      console.log("[PayPal Webhook] Processing capture:", {
        captureId,
        orderId,
        amount: capture.amount?.value,
        currency: capture.amount?.currency_code
      });

      if (!orderId) {
        console.error("[PayPal Webhook] No orderId found in webhook payload:", {
          captureId,
          supplementaryData: capture.supplementary_data
        });
        return res.sendStatus(400);
      }

      // Check if order was already processed to avoid duplicates
      const existingOrder = await Order.findOne({ orderId });
      if (existingOrder && existingOrder.paymentStatus === "Success") {
        console.log("[PayPal Webhook] Order already processed, skipping:", orderId);
        return res.sendStatus(200);
      }

      // Update the order
      const order = await Order.findOneAndUpdate(
        { orderId },
        {
          paymentId: captureId,
          paymentStatus: "Success",
          paymentTime: new Date(),
          paymentType: "PayPal",
        },
        { new: true }
      );

      if (!order) {
        console.error("[PayPal Webhook] Order not found in database:", orderId);
        return res.sendStatus(404);
      }

      console.log("[PayPal Webhook] Order updated successfully:", {
        orderId: order.orderId,
        paymentId: captureId,
        email: order.email,
        amount: order.amount
      });

      // Process emails and invoice
      try {
        const formattedPaymentTime = order.paymentTime.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Riyadh",
        });

        console.log("[PayPal Webhook] Generating invoice for order:", orderId);

        // Generate invoice PDF
        const invoicePdfPath = await generateInvoicePDF({
          ...order.toObject(),
          paymentTime: formattedPaymentTime,
          paymentType: "PayPal",
        });

        console.log("[PayPal Webhook] Invoice generated successfully:", invoicePdfPath);

        // Prepare attachments
        const attachments = [
          {
            filename: `Invoice_${order.orderId}.pdf`,
            path: invoicePdfPath, // Use path instead of content for file-based PDF
          },
        ];

        // Send email to customer
        if (order.email) {
          console.log("[PayPal Webhook] Sending customer email to:", order.email);
          
          await sendEmail({
            to: order.email,
            subject: "Payment Cleared - Your Invoice is Ready",
            template: "invoice",
            data: {
              ...order.toObject(),
              paymentTime: formattedPaymentTime,
              paymentType: "PayPal",
              deliveryTime: order.deliveryTime,
            },
            attachments,
          });

          console.log("[PayPal Webhook] Customer email sent successfully");
        } else {
          console.warn("[PayPal Webhook] No customer email address found for order:", orderId);
        }

        // Send email to admin
        console.log("[PayPal Webhook] Sending admin notification email");
        
        await sendEmail({
          to: "genuineunlockerinfo@gmail.com",
          subject: "PayPal Payment Cleared - New Order Ready",
          template: "newOrder",
          data: {
            ...order.toObject(),
            paymentTime: formattedPaymentTime,
            paymentType: "PayPal (Webhook)",
            deliveryTime: order.deliveryTime,
          },
          attachments,
        });

        console.log("[PayPal Webhook] Admin notification email sent successfully");
        console.log("[PayPal Webhook] Webhook processed successfully: order updated & invoices sent");

      } catch (emailError) {
        console.error("[PayPal Webhook] Email processing error:", {
          orderId,
          error: emailError.message,
          stack: emailError.stack
        });
        
        // Don't fail the webhook response even if email fails
        // PayPal should still get a 200 response
      }

    } else if (event.event_type === "PAYMENT.CAPTURE.PENDING") {
      // Handle pending payments
      const capture = event.resource;
      const captureId = capture.id;
      const orderId = capture.supplementary_data?.related_ids?.order_id || capture.custom_id;

      console.log("[PayPal Webhook] Payment capture pending:", {
        captureId,
        orderId,
        reason: capture.status_details?.reason
      });

      if (orderId) {
        await Order.findOneAndUpdate(
          { orderId },
          {
            paymentId: captureId,
            paymentStatus: "Pending",
            paymentTime: new Date(),
            paymentType: "PayPal",
          },
          { new: true }
        );

        console.log("[PayPal Webhook] Order marked as pending:", orderId);
      }

    } else if (event.event_type === "PAYMENT.CAPTURE.DENIED") {
      // Handle denied payments
      const capture = event.resource;
      const captureId = capture.id;
      const orderId = capture.supplementary_data?.related_ids?.order_id || capture.custom_id;;

      console.log("[PayPal Webhook] Payment capture denied:", {
        captureId,
        orderId,
        reason: capture.status_details?.reason
      });

      if (orderId) {
        await Order.findOneAndUpdate(
          { orderId },
          {
            paymentId: captureId,
            paymentStatus: "Failed",
            paymentTime: new Date(),
            paymentType: "PayPal",
          },
          { new: true }
        );

        console.log("[PayPal Webhook] Order marked as failed:", orderId);
      }

    } else {
      console.log("[PayPal Webhook] Unhandled event type:", event.event_type);
    }

    // Always respond with 200 to PayPal to acknowledge receipt
    res.sendStatus(200);

  } catch (error) {
    console.error("[PayPal Webhook] Handler error:", {
      error: error.message,
      stack: error.stack,
      eventType: req.body?.event_type,
      eventId: req.body?.id
    });

    // Still respond with 200 to avoid PayPal retrying
    // Log the error but don't fail the webhook
    res.sendStatus(200);
  }
}

module.exports = paypalWebhook;