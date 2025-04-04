require('dotenv').config(); // Load environment variables from .env
const mysql = require('mysql2');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const userRoutes = require("./route/UserRoutes");

const app = express();
app.use(express.json()); // Middleware for JSON parsing
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // ✅ Enables parsing of form data

const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set in .env

// Create MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

app.use("/api/users", userRoutes);

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});