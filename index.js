const express = require('express');
const fs = require("fs").promises;  // Using fs.promises for async file handling
const { open } = require('sqlite');
const sqlite3 = require("sqlite3");
const path = require('path');
const dbPath = path.join(__dirname, "database.db");
const rateLimit = require('express-rate-limit');
const logFilePath = path.join(__dirname, 'logs.json');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

let db = null;

// Rate Limiting Middleware (100 requests per 15 minutes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        status: 429,
        error: "Too many requests",
        message: "You have exceeded 100 requests in 15 minutes. Please try again later.",
    },
    headers: true,
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Database Initialization
const intialization = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(3000, () => {
            console.log("Server running successfully");
        });

    } catch (e) {
        console.log(`DB error ${e.message}`);
        process.exit(1);
    }
};

intialization();

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
    let jwtToken;
    const authHeader = req.headers["authorization"];
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
    }

    if (jwtToken === undefined) {
        res.status(401);
        res.send("Invalid access token");
    } else {
        jwt.verify(jwtToken, 'hsud377d7edyed', async (error, payload) => {
            if (error) {
                res.status(401);
                res.send("Invalid Jwt Token");
            } else {
                next();
            }
        });
    }
};

// User Registration
app.post("/new_users/", async (req, res) => {
    const { username, name, password, location, gender } = req.body;
    const validGenders = ["Male", "Female", "Other"];
    if (!validGenders.includes(gender)) {
        return res.status(400).send("Invalid gender. Allowed values: Male, Female, Other.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM new_users WHERE username=?;`;
    const dbUser = await db.get(selectUserQuery, [username]);

    if (dbUser == undefined) {
        const createUserQuery = `
        INSERT INTO 
        new_users(username, name, password, location, gender)
        VALUES(?, ?, ?, ?, ?);`;
        await db.run(createUserQuery, [username, name, hashedPassword, location, gender]);
        res.send("User Created Successfully!");
    } else {
        res.status(400);
        res.send("User already exists");
    }
});

// User Login
app.post('/login', async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM new_users WHERE username=?;`;
    const dbUser = await db.get(selectUserQuery, [username]);

    if (dbUser == undefined) {
        response.status(400);
        response.send("Invalid User");
    } else {
        const comparePassword = await bcrypt.compare(password, dbUser.password);
        if (comparePassword == true) {
            const payload = dbUser.username;
            const jwtToken = jwt.sign(payload, 'hsud377d7edyed');
            response.send({ jwtToken });
        } else {
            response.status(400);
            response.send("Invalid Password");
        }
    }
});

// Request Logging Function
const logRequest = async (method, url, requestBody) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: method,
        url: url,
        requestBody: requestBody || null
    };

    try {
        let logs = [];
        try {
            const data = await fs.readFile(logFilePath, 'utf-8');
            logs = JSON.parse(data);
        } catch (readError) {
            console.log("Creating new log file...");
        }

        logs.push(logEntry);
        await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2));
        console.log("Log updated successfully");
    } catch (error) {
        console.error("Error logging request:", error);
    }
};

// Get all items
app.get("/api/items/", authenticateToken, async (req, res) => {
    const getItemsQuery = `SELECT * FROM items ORDER BY id;`;
    const dbItems = await db.all(getItemsQuery);
    await logRequest("GET", "/api/items/", null);
    res.send(dbItems);
});

// Get a single item by ID
app.get("/api/items/:id/", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const getItemQuery = `SELECT * FROM items WHERE id=${id};`;
    const dbItem = await db.get(getItemQuery);
    
    if (dbItem) {
        await logRequest("GET", `/api/items/${id}/`, null);
        res.send(dbItem);
    } else {
        res.status(404).send({ error: "Item not found" });
    }
});

// Add a new item
app.post("/api/items/", authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const addItemQuery = `
        INSERT INTO 
        items(name, description)
        VALUES(?, ?);`;
        const dbResponse = await db.run(addItemQuery, [name, description]);
        const itemId = dbResponse.lastID;
        await logRequest("POST", "/api/items/", req.body);
        res.status(201).json({ itemId: itemId, message: "Item added successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update an existing item
app.put("/api/items/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const updateItemQuery = `
    UPDATE items
    SET name = ?, description = ?
    WHERE id = ?;`;
    
    try {
        await db.run(updateItemQuery, [name, description, id]);
        await logRequest("PUT", `/api/items/${id}/`, req.body);
        res.send("Item Updated Successfully!");
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// Delete an item
app.delete("/api/items/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const deleteItemQuery = `DELETE FROM items WHERE id=?;`;

    try {
        await db.run(deleteItemQuery, [id]);
        await logRequest("DELETE", `/api/items/${id}/`, null);
        res.send("Item Deleted Successfully");
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error" });
    }
});
