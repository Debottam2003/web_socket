import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import pool from "./db.js"; // Assuming db.js is in the same directory

let users = {};

const app = express();

app.use(cors({
    orirgin: "*", // Adjust this to your frontend URL
    methods: ["GET", "POST"],
}));

const http_server = http.createServer(app);

const io = new Server(http_server, { cors: { origin: "*" } });

app.use(express.json()); // Middleware to parse JSON bodies

app.get("/", (req, res) => {
    res.send("hello world");
});

app.post("/login", async (req, res) => {
    console.log("Login request received:", req.body);
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({message: "Email and password are required"});
    }
    try {
        const query = "SELECT email FROM users WHERE email = $1 AND password = $2";
        const values = [email, password];
        const result = await pool.query(query, values);
        if (result.rows.length > 0) {
            const user = result.rows[0].email;
            console.log(user);
            res.status(200).json({message: "Login successful", user});
        } else {
            res.status(401).json({message: "Invalid email or password"});
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

io.on('connection', (socket) => {

    // When a new user connects, we can log their socket ID
    // and store the socketid in the users object

    socket.emit("connection", `welcome ${socket.id}`);

    socket.on("register", (user) => {
        users[user] = socket.id;
        console.log(users);
        socket.emit("registerACK", `User ${user} registered with socket ID ${socket.id}`);
    });

    // Server Accepting data for log event emit from the client
    socket.on("message", (...args) => {
        console.log(args);
        // Server emiting data on reply event
        const {sender, msg, receiver} = args[0];
        users[sender] = socket.id;
        console.log(users);
        // socket.broadcast.emit("reply", msg);
        io.to(users[receiver]).emit("reply", {sender, msg});
    });

    console.log(socket.id);
    // console.log(socket);
    console.log(socket.id + " user is connected.");

    // socket.emit() → sends to the current socket only.

    // socket.broadcast.emit() → sends to everyone except the current socket.

    // io.emit() → sends to everyone including the sender.

});

http_server.listen(3333, (req, res) => {
    console.log("Server is running and listening on port: 3333");
});


