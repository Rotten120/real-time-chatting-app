const form = document.getElementById("login-form");
const submitBtn = document.getElementById("submit-btn");
const errorMsg = document.getElementById("error-msg");

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.style.display = "block";
}

function hideError() {
  errorMsg.style.display = "none";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const chatRoomId = document.getElementById("chat-room-id").value.trim();

  submitBtn.disabled = true;

  try {
    console.log("Signing in...");
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",          // ensures the cookie set by setCookie() is saved
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message || "Something went wrong. Please try again.");
      return;
    }

    // Redirect to the chat room
    window.location.href = `/chat/t/${chatRoomId}`;
  } catch (err) {
    console.error(err);
    showError("Could not reach the server. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign in";
  }
});
