const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ✅ Create a New User (Auto-Increment `user_id`)
exports.createUser = async (req, res) => {
    try {
        const { first_name, last_name, phone_number, email, password, role, address } = req.body;
        const db = req.db;

        // Validate role
        const validRoles = ['customer', 'manager', 'admin'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: "🚨 Invalid role. Must be one of: customer, manager, admin" });
        }

        // ✅ Check if email already exists
        db.execute("SELECT * FROM user WHERE email = ?", [email], async (err, existingUser) => {
            if (err) return res.status(500).json({ message: "Server Error", error: err });

            if (existingUser.length > 0) {
                return res.status(400).json({ message: "🚨 Email already in use!" });
            }

            // ✅ Hash Password
            const hashedPassword = await bcrypt.hash(password, 10);

            // ✅ Insert user WITHOUT `user_id`
            db.execute(
                "INSERT INTO user (first_name, last_name, phone_number, email, password, role, address) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [first_name, last_name, phone_number, email, hashedPassword, role || 'customer', address],
                (err, result) => {
                    if (err) return res.status(500).json({ message: "Server Error", error: err });

                    res.status(201).json({
                        message: "✅ User created successfully",
                        user_id: result.insertId, // ✅ Return the auto-generated `user_id`
                        role: role || 'customer' // Return the role that was set
                    });
                }
            );
        });

    } catch (error) {
        console.error("Create User Error:", error);
        res.status(500).json({ message: "Server Error", error });
    }
};

// ✅ LOGIN USER (Using Cookie-Based Authentication)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = req.db;

        // ✅ Fetch user from MySQL database
        db.execute("SELECT * FROM user WHERE email = ?", [email], async (err, users) => {
            if (err) return res.status(500).json({ message: "Server Error", error: err });

            if (users.length === 0) {
                return res.status(400).json({ message: "❌ Invalid credentials" });
            }

            const user = users[0];

            // ✅ Compare hashed password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "❌ Invalid credentials" });
            }

            // ✅ Generate JWT Token with enhanced security
            const token = jwt.sign(
                { 
                    user_id: user.user_id, 
                    email: user.email,
                    role: user.role // Include role in the token
                }, 
                process.env.JWT_SECRET, 
                { 
                    expiresIn: "1h",
                    algorithm: 'HS256'
                }
            );

            // ✅ Send token as HTTP-Only Cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: 'strict',
                maxAge: 3600000,
                path: '/',
                domain: process.env.NODE_ENV === "production" ? process.env.DOMAIN : 'localhost'
            }).status(200).json({
                message: "✅ Login successful",
                user: {
                    id: user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                    phone_number: user.phone_number,
                    address: user.address
                }
            });
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server Error", error });
    }
};

// ✅ LOGOUT USER (Clear Cookie)
exports.logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'strict',
        expires: new Date(0),
        path: '/',
        domain: process.env.NODE_ENV === "production" ? process.env.DOMAIN : 'localhost'
    }).status(200).json({ message: "✅ Logged out successfully" });
};

// ✅ Get All Users
exports.getUsers = async (req, res) => {
    try {
        const db = req.db;
        db.execute("SELECT * FROM user", (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error", error: err });

            res.status(200).json(results);
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// ✅ Get a Single User by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.db;
        db.execute("SELECT * FROM user WHERE user_id = ?", [id], (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error", error: err });

            if (results.length === 0) {
                return res.status(404).json({ message: "❌ User not found!" });
            }

            res.status(200).json(results[0]);
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// ✅ Update User
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone_number, email, address, role } = req.body;
        const db = req.db;

        // Validate role if provided
        if (role) {
            const validRoles = ['customer', 'manager', 'admin'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ message: "🚨 Invalid role. Must be one of: customer, manager, admin" });
            }
        }

        // ✅ Check if user exists
        db.execute("SELECT * FROM user WHERE user_id = ?", [id], (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error", error: err });

            if (results.length === 0) {
                return res.status(404).json({ message: "❌ User not found!" });
            }

            // ✅ Update user details
            db.execute(
                "UPDATE user SET first_name=?, last_name=?, phone_number=?, email=?, address=?, role=? WHERE user_id=?",
                [first_name, last_name, phone_number, email, address, role, id],
                (err, result) => {
                    if (err) return res.status(500).json({ message: "Server Error", error: err });

                    res.status(200).json({ message: "✅ User updated successfully" });
                }
            );
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// ✅ Delete User
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const db = req.db;

        // ✅ Check if user exists
        db.execute("SELECT * FROM user WHERE user_id = ?", [id], (err, results) => {
            if (err) return res.status(500).json({ message: "Server Error", error: err });

            if (results.length === 0) {
                return res.status(404).json({ message: "❌ User not found!" });
            }

            // ✅ Delete user
            db.execute("DELETE FROM user WHERE user_id = ?", [id], (err, result) => {
                if (err) return res.status(500).json({ message: "Server Error", error: err });

                res.status(200).json({ message: "✅ User deleted successfully" });
            });
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

// ✅ Verify token
exports.verifyToken = async (req, res) => {
    try {
        // If we get here, it means the token was valid (checked by authenticateUser middleware)
        res.status(200).json({ 
            message: "✅ Token is valid",
            user: {
                id: req.user.user_id,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error("Token Verification Error:", error);
        res.status(401).json({ message: "❌ Token verification failed" });
    }
};
