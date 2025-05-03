require('dotenv').config(); // Load environment variables from .env
const mysql = require('mysql2');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const userRoutes = require("./route/UserRoutes");
const feedbackRoutes = require("./route/FeedbackRoutes");
const inventoryItemRoutes = require("./route/InventoryItemRoutes");
const purchaseRoutes = require("./route/PurchaseRoutes");
const inventoryStockRoutes = require("./route/InventoryStockRoutes");
const productRoutes = require("./route/ProductRoutes");
const InventoryReleaseRoutes = require("./route/InventoryReleaseRoutes");
const OrderRoutes = require("./route/OrderRoutes");
const productLogRoutes = require("./route/ProductLogRoutes");
const recipeRoutes = require("./route/recipeRoutes");
const paymentRoutes = require("./route/paymentRoutes");
const saleRoutes = require("./route/saleRoutes");
const productInventoryReleaseRoutes = require("./route/ProductInventoryReleaseRoutes");
const predictSalesRoute = require('./route/predictSales');

const app = express();

// Other middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - Must be before other middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));

// Create MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

const PORT = process.env.PORT || 3000;

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

// Pass `db` to routes
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/inventory-items", inventoryItemRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/inventory-stocks", inventoryStockRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory-releases", InventoryReleaseRoutes);
app.use("/api/orders", OrderRoutes);
app.use("/api/production-logs", productLogRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/production-inventory-releases", productInventoryReleaseRoutes);
app.use('/api', predictSalesRoute);

// Start Express Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Close the connection when the app exits
process.on("SIGINT", () => {
    db.end((err) => {
        if (err) console.log("Error closing MySQL connection:", err);
        console.log("MySQL connection closed.");
        process.exit();
    });
});