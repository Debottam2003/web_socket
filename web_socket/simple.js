
let sender = localStorage.getItem("user");
let receiver = localStorage.getItem("receiver");
// If user is not logged in, redirect to login page

if (sender && receiver) {
    const username = document.getElementById("username");
    username.textContent = `You: ${sender}`;
    const receiverName = document.getElementById("receiver");
    receiverName.textContent += `: ${receiver}`;

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

    socket.on("receiverNotFound", (message) => {
        console.error(message);
        alert(message);
    });

    // Display reply from server
    socket.on("reply", (message) => {
        console.log(message);
        if (message.msg) {
            const new_msg = document.createElement("h3");
            new_msg.textContent = message.msg;
            new_msg.classList.add("incoming-msg");
            chatting_area.appendChild(new_msg);
            
            //*** Scroll to the bottom of the chat area
            chatting_area.lastElementChild?.scrollIntoView({ behavior: "smooth" });
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

            image.onload = () => {
                chatting_area.appendChild(imageDiv);
                chatting_area.lastElementChild?.scrollIntoView({ behavior: "smooth" });
            };

        }
    });

    // Handle form submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Add this to prevent any bubbling

        let msg = document.getElementById("msg").value.trim();
        let file = document.getElementById("document").files[0];

        if (!msg && !file) return; // prevent blank submissions

        if (msg) {
            const own_msg = document.createElement("h3");
            own_msg.textContent = msg;
            own_msg.classList.add("own-msg");
            chatting_area.appendChild(own_msg);
            chatting_area.lastElementChild?.scrollIntoView({ behavior: "smooth" });
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

                image.onload = () => {
                    chatting_area.appendChild(imageDiv);
                    chatting_area.lastElementChild?.scrollIntoView({ behavior: "smooth" });
                };

                // Read file as array buffer and send to the server
                const imageSTR = await file.arrayBuffer();
                console.log("Sending byteArray:", imageSTR);
                socket.emit("message", { sender, msg, imageSTR, receiver });

            } else if (msg) {
                // Send just the message
                socket.emit("message", { sender, msg, imageSTR: null, receiver });
            }

            // Reset form after successful handling
            document.getElementById("msg").value = "";
            form.reset();
            document.getElementById('file-name').textContent = "No file chosen"; // Clear file name display
        } catch (error) {
            console.error("Error handling form submission:", error);
        }
    });

    // log out
    const logout = document.getElementById("logout");
    logout.addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("receiver");
        socket.disconnect(() => {
            console.log("Disconnected from the server");
        });
        window.location.href = "login.html";
    });

}
else {
    window.location.href = "./login.html";
}

