const form = document.querySelector("#chatForm");
const input = document.querySelector("#messageInput");
const messagesEl = document.querySelector("#messages");
const welcome = document.querySelector("#welcome");
const sendBtn = document.querySelector("#sendBtn");
const history = [];

function addMessage(role, content, extraClass = "") {
  const row = document.createElement("div");
  row.className = `message ${role} ${extraClass}`.trim();
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "assistant" ? "🦊" : "ВЫ";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  row.append(avatar, bubble);
  messagesEl.append(row);
  row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  return { row, bubble };
}
function autoSize() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
}
input.addEventListener("input", autoSize);
document.querySelectorAll("[data-prompt]").forEach(btn => {
  btn.addEventListener("click", () => {
    input.value = btn.dataset.prompt;
    input.focus();
    autoSize();
    if (btn.classList.contains("suggestion")) form.requestSubmit();
  });
});
document.querySelector("#newChat").addEventListener("click", () => {
  history.length = 0;
  messagesEl.replaceChildren();
  welcome.hidden = false;
  input.value = "";
  autoSize();
  input.focus();
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || sendBtn.disabled) return;
  welcome.hidden = true;
  addMessage("user", text);
  history.push({ role: "user", content: text });
  input.value = "";
  autoSize();
  sendBtn.disabled = true;
  const pending = addMessage("assistant", "Лис АИ думает…", "pending");
  pending.bubble.classList.add("typing");
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Что-то пошло не так.");
    pending.bubble.textContent = data.reply;
    pending.bubble.classList.remove("typing");
    history.push({ role: "assistant", content: data.reply });
  } catch (error) {
    pending.bubble.textContent = "⚠️ " + error.message;
    pending.bubble.classList.remove("typing");
    pending.bubble.style.borderColor = "#765342";
  } finally {
    pending.row.classList.remove("pending");
    sendBtn.disabled = false;
    input.focus();
  }
});
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});