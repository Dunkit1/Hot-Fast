require('dotenv').config(); // Load environment variables from .env
const mysql = require('mysql2');
const express = require('express');

const app = express();
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

// Sample Route to Test Connection
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            res.status(500).send('Database Query Error');
            return;
        }
        res.json(results);
    });
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});