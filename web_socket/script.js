document.addEventListener("DOMContentLoaded", () => {
    let sender = localStorage.getItem("user");
    // If user is not logged in, redirect to login page

    if (sender) {
        const username = document.getElementById("username");
        username.textContent = sender;

        const chatting_area = document.getElementById("chatting_area");
        const form = document.querySelector("form");
        const socket = io("http://localhost:3333", {
            query: { sender: sender }
        });

        socket.on("connect", () => {
            console.log("Connected to the server with socket ID:", socket.id);
        });

        socket.on("welcome", (ack) => {
            console.log(ack);
        });

        socket.emit("register", sender);

        socket.on("registerACK", (ack) => {
            console.log(ack);
        });

        // Display reply from server
        socket.on("reply", (message) => {
            console.log(message);
            if (message.msg) {
                const new_msg = document.createElement("h3");
                new_msg.textContent = message.msg;
                new_msg.classList.add("incoming-msg");
                chatting_area.appendChild(new_msg);
            }
            if (message.imageSTR) {
                // Convert the received ArrayBuffer to Uint8Array for better view
                console.log("Received byteArray:", new Uint8Array(message.imageSTR));
                let imageDiv = document.createElement("div");
                imageDiv.classList.add("incoming-img-msg");

                let image = document.createElement("img");
                // convert the ArrayBuffer to Blob and then create a URL
                let blob = new Blob([message.imageSTR], { type: "image/png" });
                let imgUrl = URL.createObjectURL(blob);
                image.src = imgUrl;

                imageDiv.appendChild(image);
                chatting_area.appendChild(imageDiv);
            }
            // if (message.url !== "") {
            //     let imageDiv = document.createElement("div");
            //     imageDiv.classList.add("incoming-img-msg");

            //     let image = document.createElement("img");
            //     image.src = message.url;

            //     imageDiv.appendChild(image);
            //     chatting_area.appendChild(imageDiv);
            // }
        });

        // Handle form submission
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            e.stopPropagation(); // Add this to prevent any bubbling

            let msg = document.getElementById("msg").value.trim();
            let file = document.getElementById("document").files[0];
            let receiver = document.getElementById("receiver").value.trim();

            if (msg) {
                const own_msg = document.createElement("h3");
                own_msg.textContent = msg;
                own_msg.classList.add("own-msg");
                chatting_area.appendChild(own_msg);
            }

            try {
                if (file) {
                    // Display preview immediately
                    let url = URL.createObjectURL(file);
                    let imageDiv = document.createElement("div");
                    imageDiv.classList.add("own-img-msg");

                    let image = document.createElement("img");
                    image.src = url;
                    imageDiv.appendChild(image);
                    chatting_area.appendChild(imageDiv);

                    // Read file as array buffer
                    const arrayBuffer = await readFileAsArrayBuffer(file);
                    // convert ArrayBuffer to Uint8Array
                    const imageSTR = new Uint8Array(arrayBuffer);
                    console.log("Sending byteArray:", imageSTR);

                    // Send the message with file
                    // socket.emit("message", { sender, msg, byteArray, receiver });
                    socket.emit("message", { sender, msg, imageSTR, receiver });
                } else if (msg) {
                    // Send just the message
                    socket.emit("message", { sender, msg, imageSTR: null, receiver });
                }

                // Reset form after successful handling
                document.getElementById("msg").value = "";
                form.reset();
                document.getElementById("receiver").value = receiver; // Keep the receiver field intact
            } catch (error) {
                console.error("Error handling form submission:", error);
            }
        });

        // Helper function to read file as ArrayBuffer
        function readFileAsArrayBuffer(file) {
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = (error) => reject(error);
                reader.readAsArrayBuffer(file);
            });
        }
    }
    else {
        alert("Please login first to chat.");
        window.location.href = "login.html";
    }

    // log out
    const logout = document.getElementById("logout");
    logout.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });
});

// const arrayBuffer = await file.arrayBuffer();

// socket.emit("image", arrayBuffer); // 👈 Send the raw ArrayBuffer directly

// *** 📁 File → ArrayBuffer → Uint8Array → Blob → URL.createObjectURL()

// This is for sending the file to the server as a byte array.
// then previewing the file in the chat area.
// File -> then read the file as an ArrayBuffer using FileReader
// -> then convert the ArrayBuffer to a Uint8Array
// -> then create a Blob from the Uint8Array
// -> finally create a URL using URL.createObjectURL(blob)

// Directly URL.createObjectURL(file) is good for image/video previews, quick in-browser use.

// ByteArray Transmission:
//     When sending binary data (byteArray), Socket.io may need to switch transports
//     This can sometimes cause the connection to reset
//     Binary data is more complex to handle and can trigger reconnection logic

// if we donot mention maxHttpBufferSize the default is 1MB
// and if we want to send larger files then connection drops the payload
// and connection is reset

// | Sent from | Sent type     | Received as               |
// | --------- | ------------- | ------------------------- |
// | Client JS | `Uint8Array`  | Node `Buffer`             |
// | Client JS | `ArrayBuffer` | Node `Buffer`             |
// | Server    | `Buffer`      | `ArrayBuffer` (on client) |
