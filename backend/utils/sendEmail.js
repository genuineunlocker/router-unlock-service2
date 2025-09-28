const nodemailer = require("nodemailer");
const generateInvoicePDF = require("./generateInvoicePDF");
const fs = require("fs");

// Validate required environment variables
const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

const sendEmail = async ({ to, subject, template, data, attachments = [] }) => {
  // Destructure data with fallback values to prevent "undefined" in templates
  const {
    country = 'N/A',
    brand = 'N/A',
    model = 'N/A',
    network = 'N/A',
    imei = 'N/A',
    serialNumber = 'N/A',
    mobileNumber = 'N/A',
    email = 'N/A',
    amount = '0',
    orderId = 'N/A',
    paymentTime = 'N/A',
    paymentType = 'Unknown',
    deliveryTime = 'N/A'
  } = data;

  // Validate required parameters
  if (!to || !subject || !template || !data) {
    throw new Error('Missing required parameters: to, subject, template, data');
  }

  console.log(`📧 Preparing to send email to ${to} with template: ${template}`);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  });

  let htmlContent = "";
  let finalAttachments = [...attachments]; // Start with externally provided attachments

  if (template === "invoice") {
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .order-details { background: #f9f9f9; padding: 20px; border-radius: 5px; }
          .order-details ul { list-style: none; padding: 0; }
          .order-details li { padding: 5px 0; border-bottom: 1px solid #eee; }
          .footer { margin-top: 30px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Order Successfully Placed - Your Invoice</h2>
          </div>
          <p>Dear Customer,</p>
          <p>Thank you! Your order with GenuineUnlocker Router Unlock Service has been placed successfully, and your payment has been received.</p>
          
          <div class="order-details">
            <h3>Order Details:</h3>
            <ul>
              <li><strong>Order ID:</strong> ${orderId}</li>
              <li><strong>Brand:</strong> ${brand}</li>
              <li><strong>Model:</strong> ${model}</li>
              <li><strong>Country:</strong> ${country}</li>
              <li><strong>Network:</strong> ${network}</li>
              <li><strong>IMEI:</strong> ${imei}</li>
              <li><strong>Serial Number:</strong> ${serialNumber}</li>
              <li><strong>WhatsApp Number:</strong> ${mobileNumber}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Amount Paid:</strong> USD ${amount}</li>
              <li><strong>Payment Time:</strong> ${paymentTime}</li>
              <li><strong>Payment Method:</strong> ${paymentType}</li>
              <li><strong>Expected Delivery:</strong> ${deliveryTime}</li>
            </ul>
          </div>
          
          <p><strong>Your invoice is attached to this email.</strong></p>
          <p>We will process your unlock request and deliver it within the specified timeframe.</p>
          
          <div class="footer">
            <p>Best regards,<br><strong>Genuine Unlocker Team</strong></p>
            <p>Email: genuineunlockerinfo@gmail.com | Website: www.genuineunlocker.net</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Only generate PDF if no attachments provided externally
    if (finalAttachments.length === 0) {
      try {
        console.log(`📄 Generating PDF invoice for order ${orderId}`);
        const filePath = await generateInvoicePDF(data);
        finalAttachments.push({
          filename: `Invoice-${orderId}.pdf`,
          path: filePath,
        });
        console.log(`✅ PDF generated successfully: ${filePath}`);
      } catch (pdfError) {
        console.error(`❌ PDF generation failed for order ${orderId}:`, pdfError);
        // Don't fail email sending if PDF fails
      }
    }

  } else if (template === "newOrder") {
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f4e78; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .order-details { background: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .order-details ul { list-style: none; padding: 0; }
          .order-details li { padding: 8px 0; border-bottom: 1px solid #ddd; }
          .urgent { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 New Router Unlock Order Received</h2>
          </div>
          
          <div class="urgent">
            <p><strong>⚡ URGENT:</strong> A new order requires your attention!</p>
          </div>
          
          <div class="order-details">
            <h3>📋 Order Information:</h3>
            <ul>
              <li><strong>Order ID:</strong> ${orderId}</li>
              <li><strong>Brand:</strong> ${brand}</li>
              <li><strong>Model:</strong> ${model}</li>
              <li><strong>Country:</strong> ${country}</li>
              <li><strong>Network:</strong> ${network}</li>
              <li><strong>IMEI:</strong> ${imei}</li>
              <li><strong>Serial Number:</strong> ${serialNumber}</li>
              <li><strong>Customer WhatsApp:</strong> ${mobileNumber}</li>
              <li><strong>Customer Email:</strong> ${email}</li>
              <li><strong>Amount Received:</strong> USD ${amount}</li>
              <li><strong>Payment Time:</strong> ${paymentTime}</li>
              <li><strong>Payment Method:</strong> ${paymentType}</li>
              <li><strong>Expected Delivery:</strong> ${deliveryTime}</li>
            </ul>
          </div>
          
          <div class="urgent">
            <p><strong>📞 Next Steps:</strong></p>
            <ul>
              <li>Process the unlock request immediately</li>
              <li>Contact customer via WhatsApp: ${mobileNumber}</li>
              <li>Provide unlock code within ${deliveryTime}</li>
            </ul>
          </div>
          
          <p style="text-align: center; margin-top: 30px;">
            <strong>Admin Dashboard | Genuine Unlocker</strong>
          </p>
        </div>
      </body>
      </html>
    `;

  } else if (template === "pendingPayment") {
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .pending-notice { background: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107; }
          .order-summary { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⏳ Payment Pending - Order Confirmation</h2>
          </div>
          
          <div class="pending-notice">
            <h3>🔔 Your Payment is Being Processed</h3>
            <p>Thank you for your order! Your PayPal payment is currently being processed and should clear within a few minutes to a few hours.</p>
          </div>
          
          <div class="order-summary">
            <h3>Order Summary:</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Device:</strong> ${brand} ${model}</p>
            <p><strong>Amount:</strong> USD ${amount}</p>
            <p><strong>Payment Method:</strong> ${paymentType}</p>
          </div>
          
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>✅ We'll automatically send your invoice once payment clears</li>
            <li>✅ Our team will begin processing your unlock request</li>
            <li>✅ You'll receive the unlock code within ${deliveryTime}</li>
          </ul>
          
          <p>If you have any questions, please contact us at genuineunlockerinfo@gmail.com</p>
          
          <p>Best regards,<br><strong>Genuine Unlocker Team</strong></p>
        </div>
      </body>
      </html>
    `;

  } else {
    throw new Error(`Invalid email template specified: ${template}`);
  }

  const mailOptions = {
    from: `"Genuine Unlocker" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: htmlContent,
    attachments: finalAttachments,
  };

  try {
    console.log(`📤 Sending email to ${to}...`);
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to} for order ${orderId}`, {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected
    });

    // Clean up generated PDF files after sending (only local files, not buffers)
    finalAttachments.forEach(attachment => {
      if (attachment.path && attachment.filename?.includes('Invoice-')) {
        fs.unlink(attachment.path, (err) => {
          if (err) {
            console.warn(`⚠️ Failed to clean up PDF file: ${attachment.path}`);
          } else {
            console.log(`🗑️ Cleaned up PDF file: ${attachment.path}`);
          }
        });
      }
    });

    return result;

  } catch (error) {
    console.error(`❌ Failed to send email to ${to} for order ${orderId}:`, {
      error: error.message,
      stack: error.stack,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response
    });
    
    // Clean up PDF files even on error
    finalAttachments.forEach(attachment => {
      if (attachment.path && attachment.filename?.includes('Invoice-')) {
        fs.unlink(attachment.path, () => {});
      }
    });
    
    throw new Error(`Failed to send email to ${to}: ${error.message}`);
  }
};

module.exports = sendEmail;