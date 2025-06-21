import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import pool from "./db.js"; // Assuming db.js is in the same directory

let users = {};

const app = express();

app.use(cors({
    origin: "*", // Adjust this to your frontend URL
    methods: ["GET", "POST"],
}));

const http_server = http.createServer(app);

const io = new Server(http_server, {
    cors: {
        origin: "*",            // Allow all origins (adjust for production)
        methods: ["GET", "POST"] // Allowed HTTP methods
    },
    // Critical performance settings for file uploads
    maxHttpBufferSize: 16 * 1024 * 1024,  // 16MB max payload (for 2MB files + overhead)
    // whatsapp like settings
});

app.use(express.json()); // Middleware to parse JSON bodies

app.get("/users/:sender", async (req, res) => {
    try {
        console.log("Get users request received for sender:", req.params.sender);
        let {rows} = await pool.query("select id, email from chatting where email <> $1", [req.params.sender]);
        console.log("user: ", rows);
        res.status(200).json({message: rows});
    } catch(err) {
        console.error(err.message);
        res.status(500).json({message: "Internal server error"});
    }
});

app.post("/login", async (req, res) => {
    console.log("Login request received:", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try {
        const query = "SELECT email FROM chatting WHERE email = $1 AND password = $2";
        const values = [email, password];
        const result = await pool.query(query, values);
        if (result.rows.length > 0) {
            const user = result.rows[0].email;
            console.log(user);
            res.status(200).json({ message: "Login successful", user });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

io.on('connection', (socket) => {

    // When a new user connects, we can log their socket ID
    // and store the socketid in the users object
    let sender = socket.handshake.query.sender;
    if (sender) {
        users[sender] = socket.id;
    }

    socket.emit("welcome", `welcome ${socket.id}`);

    socket.on("register", (user) => {
        users[user] = socket.id;
        console.log(users);
        socket.emit("registerACK", `User ${user} registered with socket ID ${socket.id}`);
    });

    // Server Accepting data for log event emit from the client
    socket.on("message", async (...args) => {
        console.log(args);
        // Server emiting data on reply event
        const { sender, msg, imageSTR, receiver } = args[0];
        users[sender] = socket.id;
        console.log(users);
        console.log("Buffer Object:", imageSTR);
        // console.log(imageSTR, msg);
        // socket.broadcast.emit("reply", msg);
        if(!users[receiver]) {
            console.log(`User ${receiver} is not connected yet.`);
            socket.emit("receiverNotFound", `User ${receiver} is not connected.`);
            // Optionally, you can store the message for later delivery
            return;
        }
        await pool.query(
            "INSERT INTO messages (sender_email, message, receiver_email, state) VALUES ($1, $2, $3, $4)",
            [sender, msg, receiver, "sent"]
        )
        io.to(users[receiver]).emit("reply", { sender, msg, imageSTR });
    });

    console.log(socket.id);
    // console.log(socket);
    console.log(socket.id + " user is connected.");

    // socket.emit() → sends to the current socket only.

    // socket.broadcast.emit() → sends to everyone except the current socket.

    // io.emit() → sends to everyone including the sender.

    // io.to(socket.id).emit() → sends to a specific socket.

    // socket.on("disconnect") → listens for the disconnection of a socket 
    // (when manul call or close tab or network issue).
    // When a user disconnects, we can log their socket ID
    // and clean up the users object
    socket.on("disconnect", () => {
        console.log(socket.id + " user is disconnected.");
        // Clean up users object
        for (let [username, id] of Object.entries(users)) {
            if (id === socket.id) {
                delete users[username];
                console.log(`Removed ${username} from users. And closed the socket connection.`);
                break;
            }
        }
    });


});

http_server.listen(3333, (req, res) => {
    console.log("Server is running and listening on port: 3333");
});


