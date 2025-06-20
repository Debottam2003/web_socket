document.addEventListener("DOMContentLoaded", () => {
    let sender = localStorage.getItem("user");
    // If user is not logged in, redirect to login page

    if (sender) {
        const username = document.getElementById("username");
        username.textContent = sender;

        const chatting_area = document.getElementById("chatting_area");
        const form = document.querySelector("form");
        const socket = io("http://localhost:3333", {
            query: { sender }
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
                let imageDiv = document.createElement("div");
                imageDiv.classList.add("incoming-img-msg");

                let image = document.createElement("img");
                image.src = message.imageSTR; // Use the base64 string directly

                imageDiv.appendChild(image);
                chatting_area.appendChild(imageDiv);
            }
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
                    const imageSTR = await readFileAsbase64string(file);
                    console.log(imageSTR);

                    // Send the message with file
                    socket.emit("message", { sender, msg, imageSTR, receiver });
                    console.log("Image sent");
                } else if (msg) {
                    // Send just the message
                    socket.emit("message", { sender, msg, imageSTR: "", receiver });
                }

                // Reset form after successful handling
                document.getElementById("msg").value = "";
                form.reset();
                document.getElementById("receiver").value = receiver; // Keep the receiver field intact
            } catch (error) {
                console.error("Error handling form submission:", error);
            }
        });

        // Helper function to read file as base64string
        function readFileAsbase64string(file) {
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onload = (event) => resolve(event.target.result);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
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