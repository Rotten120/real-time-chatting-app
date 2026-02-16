
const chatRoomId = window.location.pathname.split("/c/")[1];
const socket = io({
  auth: {
    lastMsg: new Date(2000, 10, 30),
    chatRoomId
  }
});

console.log(`Connected to chat id ${chatRoomId}`);

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const toggleButton = document.getElementById("toggle-btn");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if(!input.value) {
    return
  }

  socket.timeout(5000).emit("chat message", input.value, (err, res) => {
    if(err) {
      console.log("An error occurred. Try again later");
      return;
    }

    console.log(res.status);
  });

  input.value = "";
});

socket.on("chat message", (msg, lastSeen) => {
  const item = document.createElement("li");
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
  socket.auth.lastMsg = lastSeen;
});

toggleButton.addEventListener("click", (e) => {
  e.preventDefault();
  if(socket.connected) {
    toggleButton.innerText = "Connect";
    socket.disconnect();
  } else {
    toggleButton.innerText = "Disconnect";
    socket.connect();
  }
});
