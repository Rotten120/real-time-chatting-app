const chatRoomId = window.location.pathname.split("/chat/t/")[1];
let user = {};

// Pagination state
let oldestMessageId = null;  // cursorId for the next fetch
let isFetchingOlder = false;  // prevent concurrent fetches
let hasMoreMessages = true;   // false when server returns empty array

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates and appends (or prepends) a message bubble to the list.
 * @param {string} id - Message ID (used as cursor reference)
 * @param {string} content - Message text
 * @param {string} senderName - Display name of the sender
 * @param {boolean} isMine - Whether this message belongs to the current user
 * @param {string} status - 'sending' | 'delivered' | 'error'
 * @param {boolean} prepend - If true, insert at the top instead of bottom
 * @returns {{ item, statusEl }}
 */
function appendMessage(id, content, senderName, isMine, status = 'sending', prepend = false) {
  const item = document.createElement("li");
  item.classList.add(isMine ? "mine" : "theirs");
  if (id) item.dataset.id = id;

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

  if (prepend) {
    messages.prepend(item);
  } else {
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  }

  return { item, statusEl };
}

/**
 * Fetches older messages using cursor-based pagination and prepends them.
 */
async function loadOlderMessages() {
  if (isFetchingOlder || !hasMoreMessages || !oldestMessageId) return;

  isFetchingOlder = true;

  // Remember scroll position so the view doesn't jump
  const prevScrollHeight = messages.scrollHeight;

  try {
    const res = await fetch(
      `/chat/${chatRoomId}/messages?cursorId=${oldestMessageId}&limit=20`,
      { credentials: "include" }
    );

    if (!res.ok) {
      console.error("Failed to fetch older messages:", res.status);
      return;
    }

    const older = await res.json();

    if (!older.length) {
      hasMoreMessages = false;
      return;
    }

    // Messages come back ordered desc (newest first), so prepend in reverse
    // so the final order in the DOM is oldest-at-top
    for (const msg of older) {
      const isMine = msg.sender === user.name;
      appendMessage(msg.id, msg.content, msg.sender, isMine, 'delivered', true);
    }

    // Update cursor to the oldest message now in the list
    oldestMessageId = older[older.length - 1].id;

    // Restore scroll position so the user stays at the same message
    window.scrollTo(0, messages.scrollHeight - prevScrollHeight);

  } catch (err) {
    console.error("Error fetching older messages:", err);
  } finally {
    isFetchingOlder = false;
  }
}

// ─── Infinite scroll: trigger when user scrolls near the top ─────────────────
window.addEventListener("scroll", () => {
  if (window.scrollY < 100) {
    loadOlderMessages();
  }
});

// ─── Socket events ────────────────────────────────────────────────────────────

socket.on("me", (userIn) => {
  user = userIn;
});

socket.on("chat message", (message) => {
  // Ignore messages from ourselves — already shown optimistically
  if (message.sender === user.name) {
    socket.auth.lastMsg = message.createdAt;
    return;
  }

  appendMessage(message.id, message.content, message.sender, false);
  socket.auth.lastMsg = message.createdAt;

  // Keep cursor up to date so pagination doesn't re-fetch recent messages
  if (!oldestMessageId) oldestMessageId = message.id;
});

socket.on("chat recover", (message) => {
  const isMine = message.sender === user.name;
  appendMessage(message.id, message.content, message.sender, isMine, 'delivered');
  socket.auth.lastMsg = message.createdAt;

  // The first recovered (or live) message sets the initial cursor
  if (!oldestMessageId) oldestMessageId = message.id;
});

// ─── Send message ─────────────────────────────────────────────────────────────

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!input.value) return;

  const content = input.value;
  input.value = "";

  // Immediately show with 'sending' status
  const { statusEl } = appendMessage(null, content, user.name, true, 'sending');

  socket.timeout(5000).emit("chat message", content, (err, res) => {
    if (!statusEl) return;

    if (err || res.status === 'failed') {
      statusEl.textContent = 'Failed to send';
      statusEl.classList.add('error');
      return;
    }

    statusEl.textContent = 'Delivered';
    statusEl.classList.remove('error');
  });
});

// ─── Connect / disconnect toggle ──────────────────────────────────────────────

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
