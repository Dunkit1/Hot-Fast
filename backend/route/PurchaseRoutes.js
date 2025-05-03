const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    getPurchasesByItemId,
    updatePurchase,
    deletePurchase
} = require("../controller/PurchaseController");

// Create new purchase (Manager and Admin only)
router.post("/", authenticateUser, createPurchase);

// Get all purchases (Manager and Admin only)
router.get("/", authenticateUser, getAllPurchases);

// Get purchases by item ID (Manager and Admin only)
router.get("/item/:itemId", authenticateUser, getPurchasesByItemId);

// Get purchase by ID (Manager and Admin only)
router.get("/:purchaseId", authenticateUser, getPurchaseById);

// Update purchase (Manager and Admin only)
router.put("/:purchaseId", authenticateUser, updatePurchase);

// Delete purchase (Manager and Admin only)
router.delete("/:purchaseId", authenticateUser, deletePurchase);

module.exports = router; 