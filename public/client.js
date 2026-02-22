const chatRoomId = window.location.pathname.split("/chat/t/")[1];
let user = {};

const socket = io({
  withCredentials: true,
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

/**
 * Creates and appends a message bubble to the list.
 * @param {string} content - Message text
 * @param {string} senderName - Display name of the sender
 * @param {boolean} isMine - Whether this message belongs to the current user
 * @param {string} status - 'sending' | 'delivered' | 'error'
 * @returns {{ item, statusEl }} - References to the list item and status element (for updating)
 */
function appendMessage(content, senderName, isMine, status = 'sending') {
  const item = document.createElement("li");
  item.classList.add(isMine ? "mine" : "theirs");

  if (!isMine) {
    const nameEl = document.createElement("span");
    nameEl.classList.add("sender-name");
    nameEl.textContent = senderName;
    item.appendChild(nameEl);
  }

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.textContent = content;
  item.appendChild(bubble);

  let statusEl = null;
  if (isMine) {
    statusEl = document.createElement("span");
    statusEl.classList.add("status");
    statusEl.textContent = status === 'sending' ? 'Sending…' : status === 'delivered' ? 'Delivered' : 'Failed to send';
    if (status === 'error') statusEl.classList.add('error');
    item.appendChild(statusEl);
  }

  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);

  return { item, statusEl };
}

socket.on("me", (userIn) => {
  user = userIn;
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!input.value) return;

  const content = input.value;
  input.value = "";

  // Immediately show the message with 'sending' status
  const { statusEl } = appendMessage(content, user.name, true, 'sending');

  socket.timeout(5000).emit("chat message", content, (err, res) => {
    if (!statusEl) return;

    if (err || res.status === 'failed') {
      statusEl.textContent = 'Failed to send';
      statusEl.classList.add('error');
      return;
    }

    // Update status to delivered
    statusEl.textContent = 'Delivered';
    statusEl.classList.remove('error');
  });
});

socket.on("chat message", (message) => {
  // Ignore messages from ourselves — we already showed them optimistically
  if (message.sender === user.name) {
    socket.auth.lastMsg = message.createdAt;
    return;
  }

  appendMessage(message.content, message.sender, false);
  socket.auth.lastMsg = message.createdAt;
});

socket.on("chat recover", (message) => {
  console.log("hello");
  if (message.sender === user.name) {
    appendMessage(message.content, user.name, true, 'delivered');
  } else {
    appendMessage(message.content, message.sender, false);
  }
  socket.auth.lastMsg = message.createdAt;
});

toggleButton.addEventListener("click", (e) => {
  e.preventDefault();
  if (socket.connected) {
    toggleButton.innerText = "Connect";
    socket.disconnect();
  } else {
    toggleButton.innerText = "Disconnect";
    socket.connect();
  }
});
