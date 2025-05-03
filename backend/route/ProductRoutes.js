const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
    createProduct,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    updateProduct,
    deactivateProduct,
    getAllCategories,
    getProductStock
} = require("../controller/ProductController");

// Create new product (Manager and Admin only)
router.post("/", authenticateUser, createProduct);

// Get all products
router.get("/", getAllProducts);

// Get all categories
router.get("/categories", getAllCategories);

// Get products by category
router.get("/category/:category", getProductsByCategory);

// Get product by ID
router.get("/:productId", getProductById);

// Update product (Manager and Admin only)
router.put("/:productId", authenticateUser, updateProduct);

// Deactivate product (Manager and Admin only)
router.delete("/:productId", authenticateUser, deactivateProduct);

// Get product stock by ID
router.get("/:productId/stock", getProductStock);

module.exports = router;