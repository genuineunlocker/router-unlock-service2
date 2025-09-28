const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const generateInvoicePDF = async (order) => {
  return new Promise(async (resolve, reject) => {
    const dir = path.join(__dirname, "../tmp");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const logoUrl = "https://genuineunlocker.net/assets/Genuine%20Unlocker%20Logo-Du2zpO-W.png";
    const logoFilePath = path.join(dir, "GenuineUnlockerLogo.png");

    const signatureUrl = "https://i.ibb.co/0RRWSBNn/signature.png";
    const signatureFilePath = path.join(dir, "GenuineUnlockerSignature.png");

    const filePath = path.join(dir, `invoice-${order.orderId}.pdf`);
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const formatDateTime = (isoString) => {
      if (!isoString) return "Not available";
      const date = new Date(isoString);
      return isNaN(date.getTime())
        ? "Not available"
        : date.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Riyadh",
          });
    };

    // Download images if missing
    if (!fs.existsSync(logoFilePath)) {
      try {
        const res = await fetch(logoUrl);
        if (res.ok) fs.writeFileSync(logoFilePath, await res.buffer());
      } catch (err) {
        console.warn("[PDF] Logo fetch failed:", err.message);
      }
    }
    if (!fs.existsSync(signatureFilePath)) {
      try {
        const res = await fetch(signatureUrl);
        if (res.ok) fs.writeFileSync(signatureFilePath, await res.buffer());
      } catch (err) {
        console.warn("[PDF] Signature fetch failed:", err.message);
      }
    }

    // ===== HEADER =====
    const headerTop = 40;

    // Invoice Heading - Center
    doc
      .fontSize(22)
      .fillColor("#333")
      .font("Helvetica-Bold")
      .text("INVOICE", 0, headerTop, { align: "center" });

    // Add gap before logo & info
    let currentY = headerTop + 40;

    // Logo
    if (fs.existsSync(logoFilePath)) {
      doc.image(logoFilePath, 50, currentY-5, { width: 70 });
    } else {
      doc.fontSize(16).text("Genuine Unlocker", 50, currentY-5);
    }

    // Company Info next to logo
    const infoStartX = 130;
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#555")
      .text("Genuine Unlocker", infoStartX, currentY+10)
      .text("Email: genuineunlockerinfo@gmail.com", infoStartX, currentY + 25)
      .text("Website: www.genuineunlocker.net", infoStartX, currentY + 40);

    // Bill To block on right
    const billToX = 350;
    doc
      .fillColor("#557")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Bill To:", billToX, currentY);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#555")
      .text(`IMIE-${order.imei} `|| "N/A", billToX, currentY + 15)
      .text(order.email || "Not provided", billToX, currentY + 30)
      .text(order.mobileNumber || "Not provided", billToX, currentY + 45);

    // ===== TABLE =====
    const tableTop = currentY + 80;
    const rowHeight = 22;
    const col1Width = 180;
    const col2Width = 300;

    const fields = [
      { label: "Order ID", value: order.orderId || "N/A" },
      { label: "Brand", value: order.brand || "N/A" },
      { label: "Model", value: order.model || "N/A" },
      { label: "Country", value: order.country || "N/A" },
      { label: "Network", value: order.network || "N/A" },
      { label: "IMEI", value: order.imei || "N/A" },
      { label: "Serial Number", value: order.serialNumber || "N/A" },
      { label: "Payment Method", value: order.paymentType || "Unknown" },
      { label: "Payment Date &Time", value: formatDateTime(order.paymentTime) },
    ];

    let y = tableTop;

    // Table Header
    doc
      .fillColor("white")
      .rect(50, y, col1Width + col2Width, rowHeight)
      .fill("#1f4e78");
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Field", 60, y + 5)
      .text("Details", 250, y + 5);

    // Table Rows
    y += rowHeight;
    fields.forEach((field, i) => {
      doc
        .fillColor(i % 2 === 0 ? "#f9f9f9" : "#ffffff")
        .rect(50, y, col1Width + col2Width, rowHeight)
        .fill();
      doc
        .fillColor("#000")
        .font("Helvetica")
        .fontSize(10)
        .text(field.label, 60, y + 6, { width: col1Width - 20 })
        .text(field.value, 250, y + 6, { width: col2Width - 20 });
      y += rowHeight;
    });

    // Total Row
    doc
      .fillColor("#1f4e78")
      .rect(50, y, col1Width + col2Width, rowHeight)
      .fill();
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Total Amount Paid", 60, y + 5)
      .text(`USD ${order.amount || "0"}`, 250, y + 5);

    y += rowHeight + 20;

    // ===== SIGNATURE =====
    if (fs.existsSync(signatureFilePath)) {
      doc.image(signatureFilePath, 50, y, { width: 160 });
    }
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#000")
      .text("Authorized Signature", 50, y + 50);

    // ===== FOOTER =====
    const footerY = 550; // fixed position to force same-page placement
    doc
      .fontSize(9)
      .fillColor("#888")
      .text(
        "Thank you for choosing Genuine Unlocker. For support, contact us at genuineunlockerinfo@gmail.com ",
        50,
        footerY,
        { align: "center" }
      )
      .text("Visit us at www.genuineunlocker.net", 50, footerY + 15, {
        align: "center",
      });

    doc.end();

    writeStream.on("finish", () => resolve(filePath));
    writeStream.on("error", (err) => reject(err));
  });
};

module.exports = generateInvoicePDF;
