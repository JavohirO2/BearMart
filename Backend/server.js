require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "store",
});

db.connect((err) => {
    if (err) {
        console.error("Database Connection Failed!", err);
    } else {
        console.log("Connected to MySQL Database");
    }
});

// Register API
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert into database
        db.query("INSERT INTO customers (username, password) VALUES (?, ?)", 
            [username, hashedPassword], 
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "User already exists or error occurred" });
                }
                res.status(201).json({ message: "User registered successfully" });
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Login API
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }


    console.log(username,password);

    db.query("SELECT * FROM customers WHERE username = ?", [username], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ message: "User Not Exist" });
        }

        const user = results[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.Password);


        console.log(await bcrypt.compare(password, user.Password));
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user.CustomersID, username: user.UserName }, SECRET_KEY, { expiresIn: "1h" });

        res.json({ message: "Login successful", token,username:user.UserName,id: user.CustomersID });
    });
});



// Save Cart API
app.post("/save-cart", (req, res) => {
    const { username, cart } = req.body;

    if (!username || !cart || cart.length === 0) {
        return res.status(400).json({ message: "Invalid cart data" });
    }

    const cartJSON = JSON.stringify(cart);

    // Check if there's an active cart (status = 0)
    db.query(
        "SELECT id FROM carts WHERE username = ? AND status = 0 LIMIT 1",
        [username],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Error checking cart" });
            }

            if (result.length > 0) {
                // Update the existing active cart
                db.query(
                    "UPDATE carts SET cart_data = ? WHERE id = ?",
                    [cartJSON, result[0].id],
                    (err, updateResult) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: "Error updating cart" });
                        }
                        res.status(200).json({ message: "Cart updated successfully" });
                    }
                );
            } else {
                // Insert a new cart only if no active cart exists
                db.query(
                    "INSERT INTO carts (username, cart_data, status) VALUES (?, ?, 0)",
                    [username, cartJSON],
                    (err, insertResult) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: "Error saving new cart" });
                        }
                        res.status(200).json({ message: "New cart created successfully" });
                    }
                );
            }
        }
    );
});


// Get Cart API
app.get("/get-cart/:username", (req, res) => {
    const { username } = req.params;

    // Query to get the cart data for the specified username and status = 0 (active cart)
    db.query("SELECT cart_data FROM carts WHERE username = ? AND status = 0", [username], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error fetching cart" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Cart not found or cart is already processed" });
        }

        try {
            const cart = JSON.parse(result[0].cart_data);
            res.status(200).json({ cart });
        } catch (parseError) {
            console.error("Error parsing cart data:", parseError);
            res.status(500).json({ message: "Error parsing cart data" });
        }
    });
});

// Checkout API - Create Order
app.post("/checkout", (req, res) => {
    const { username, orderMethod, address, driverId } = req.body;

    if (!username || !orderMethod) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if the customer exists in the customers table
    db.query("SELECT CustomersID FROM customers WHERE username = ?", [username], (err, customerResult) => {
        if (err) {
            return res.status(500).json({ message: "Error checking customer" });
        }

        if (customerResult.length === 0) {
            return res.status(400).json({ message: "Customer not found" });
        }

        const customerId = customerResult[0].CustomersID;

        // Fetch the cart from the database
        db.query("SELECT cart_data, id FROM carts WHERE username = ?  AND status = 0", [username], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error retrieving cart" });
            }

            if (result.length === 0) {
                return res.status(400).json({ message: "No items in cart" });
            }

            const cart = JSON.parse(result[0].cart_data);
            const cartId = result[0].id;
            const orderTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

            // Insert order into the orders table, including the CartID
            db.query(
                "INSERT INTO orders (CustomersID, OrderTotal, OrderMethod, DriversID, CartID) VALUES (?, ?, ?, ?, ?)",
                [customerId, orderTotal, orderMethod, driverId || null, cartId],
                (err, orderResult) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "Error creating order" });
                    }

                    // After order is placed, add or update customer details (Address)
                    db.query(
                        "INSERT INTO customersDetails (CustomersID, Address) VALUES (?, ?) ON DUPLICATE KEY UPDATE Address = VALUES(Address)",
                        [customerId, address],
                        (err, customerDetailsResult) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: "Error updating customer details" });
                            }
                    
                            // Proceed with cart status update
                            db.query(
                                "UPDATE carts SET status = 1 WHERE username = ?",
                                [username],
                                (err, updateResult) => {
                                    if (err) {
                                        console.error(err);
                                        return res.status(500).json({ message: "Error updating cart status" });
                                    }
                    
                                    res.status(200).json({ message: "Order placed successfully", orderId: orderResult.insertId });
                                }
                            );
                        }
                    );
                }
            );
        });
    });
});








app.patch("/orders/:orderId/status", (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;  // The new status should be sent in the request body.

    // Validate that the status is provided
    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    // Validate the orderId (it should be a number or valid ID)
    if (!orderId || isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
    }

    // SQL query to update the status of the order
    const query = `
        UPDATE orders
        SET status = ?
        WHERE OrderID = ?
    `;

    db.query(query, [status, orderId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error updating order status" });
        }

        // Check if any rows were updated
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Return success message
        res.status(200).json({ message: "Order status updated successfully" });
    });
});






app.get("/orders/:username", (req, res) => {
    const { username } = req.params;

    const query = `
        SELECT 
            orders.*, 
            customers.CustomersID,
            customers.username,
            customers.email,
            customersdetails.Address,
            customersdetails.City,
            customersdetails.State,
            customersdetails.ZipCode,
            carts.cart_data
        FROM 
            orders
        JOIN 
            customers ON orders.CustomersID = customers.CustomersID
        JOIN 
            customersdetails ON orders.CustomersID = customersdetails.CustomersID
        LEFT JOIN 
            (SELECT id, cart_data FROM carts GROUP BY id) as carts 
            ON orders.CartID = carts.id
        GROUP BY orders.OrderID;
    `;

    db.query(query, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching customer's orders" });
        }

        // Parse the cart data for each order
        results.forEach(order => {
            if (order.cart_data) {
                order.cart_data = JSON.parse(order.cart_data);
            }
        });

        res.status(200).json(results);
    });
});

// Get All Orders API
app.get("/orders", (req, res) => {
    const query = `
        SELECT 
            orders.*, 
            customers.CustomersID,
            customers.username,
            customers.email,
            customersdetails.Address,
            customersdetails.City,
            customersdetails.State,
            customersdetails.ZipCode,
            carts.cart_data
        FROM 
            orders
        JOIN 
            customers ON orders.CustomersID = customers.CustomersID
        JOIN 
            customersdetails ON orders.CustomersID = customersdetails.CustomersID
        LEFT JOIN 
            (SELECT id, cart_data FROM carts GROUP BY id) as carts 
            ON orders.CartID = carts.id
        GROUP BY orders.OrderID;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching orders" });
        }

        // Parse the cart data for each order
        results.forEach(order => {
            if (order.cart_data) {
                order.cart_data = JSON.parse(order.cart_data);
            }
        });

        res.status(200).json(results);
    });
});





// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
