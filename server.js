require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const path = require("path");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "Сайт ещё не подключён к AI. Добавьте OPENAI_API_KEY в настройки сервера." });
    }
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const safeMessages = messages
      .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content.slice(0, 6000) }));
    if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Напишите сообщение, чтобы начать чат." });
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "Ты LIS AI — дружелюбный, полезный AI-помощник. Отвечай на языке пользователя, ясно и честно. Если не уверен — скажи об этом." },
        ...safeMessages
      ],
      temperature: 0.7
    });
    res.json({ reply: completion.choices[0]?.message?.content || "Не получилось сформировать ответ. Попробуйте ещё раз." });
  } catch (error) {
    console.error("Chat API error:", error.message);
    res.status(500).json({ error: "Не удалось получить ответ. Проверьте настройки API и попробуйте позже." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`LIS AI запущен: http://localhost:${port}`));