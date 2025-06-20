let sender = localStorage.getItem("user");
if (sender) {

const username = document.getElementById("username");
username.textContent = sender;
    
const chatting_area = document.getElementById("chatting_area");
const form = document.querySelector("form");
const socket = io("http://localhost:3333");

socket.on("connection", (ack) => {
    console.log(ack);
});

socket.emit("register", sender);

socket.on("registerACK", (ack) => {
    console.log(ack);
});

// Display reply from server
socket.on("reply", (message) => {
    const new_msg = document.createElement("h3");
    new_msg.textContent = message.msg;
    new_msg.classList.add("incoming-msg");

    chatting_area.appendChild(new_msg);
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    let msg = document.getElementById("msg").value.trim();

    const own_msg = document.createElement("h3");
    own_msg.textContent = msg;
    own_msg.classList.add("own-msg");

    chatting_area.appendChild(own_msg);

    let receiver = document.getElementById("receiver").value.trim();
    if (!msg) return;
    socket.emit("message", { sender, msg, receiver });
    document.getElementById("msg").value = "";
    // form.reset();
});
}
else {
    alert("Please login first to chat.");
    window.location.href = "login.html";
}
