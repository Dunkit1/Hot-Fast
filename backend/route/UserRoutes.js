const express = require("express");
const userController = require("../controller/UserController");
const { authenticateUser } = require('../middleware/AuthMiddleware');

const router = express.Router();


// Public Routes
router.post("/register", userController.createUser); // Create User
router.post("/login", userController.login); // Login User
router.post("/logout", userController.logout); // Logout User

module.exports = router;