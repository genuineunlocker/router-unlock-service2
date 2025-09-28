const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const orderRoutes = require("./routes/orderRoutes");


const app = express();
const port = process.env.PORT || 5000;
app.use(cors({
  origin: ["https://genuineunlocker.net", "http://localhost:5173"],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Set Content-Security-Policy header for all responses
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https://genuineunlocker.net; script-src 'self' https://genuineunlocker.net; style-src 'self' 'unsafe-inline' https://genuineunlocker.net https://cdnjs.cloudflare.com; img-src 'self' data: https://genuineunlocker.net; font-src 'self' https://cdnjs.cloudflare.com; connect-src 'self' https://genuineunlocker.net https://api.genuineunlocker.net; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';"
  );
  next();
});

// Mount routes
app.use("/api", orderRoutes);

// Logging
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url} at ${new Date().toISOString()} from ${req.ip}`);
  next();
});

// Serve static files
app.use(express.static("public"));

// Ping route
app.get("/ping", (req, res) => {
  res.status(200).send("✅ Server is awake");
});

// Connect to MongoDB
connectDB();

// Catch-all 404 handler
app.use((req, res) => {
  console.log(`[404] Unmatched route: ${req.method} ${req.url}`);
  res.status(404).send({ error: "Route not found" });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});