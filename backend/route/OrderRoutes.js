const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
    createOrder,
    getOrder,
    getAllOrders,
    getUserOrders
} = require("../controller/OrderController");

// Create new order (Authenticated users only)
router.post("/", authenticateUser, createOrder);

// Get all orders (Authenticated users only)
router.get("/", authenticateUser, getAllOrders);

// Get specific order by ID
router.get("/:orderId", authenticateUser, getOrder);

// Get user's orders
router.get("/user/:userId", authenticateUser, getUserOrders);

module.exports = router; 