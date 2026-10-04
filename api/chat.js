const OpenAI = require("openai");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не поддерживается." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "LIS AI ещё не подключён к AI. Добавьте OPENAI_API_KEY в Vercel → Settings → Environment Variables."
    });
  }

  try {
    const body = req.body || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const safeMessages = messages
      .filter(
        m =>
          m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string"
      )
      .slice(-20)
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 6000)
      }));

    if (
      !safeMessages.length ||
      safeMessages[safeMessages.length - 1].role !== "user"
    ) {
      return res.status(400).json({
        error: "Напишите сообщение, чтобы начать чат."
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Ты LIS AI — дружелюбный, умный и полезный AI-помощник. Отвечай на языке пользователя. Отвечай ясно, естественно и по делу. Не выдумывай факты. Если не уверен — честно скажи об этом."
        },
        ...safeMessages
      ],
      temperature: 0.7
    });

    return res.status(200).json({
      reply:
        completion.choices?.[0]?.message?.content ||
        "Не получилось сформировать ответ. Попробуйте ещё раз."
    });
  } catch (error) {
    console.error("LIS AI error:", error);

    return res.status(500).json({
      error:
        "Не удалось получить ответ от AI. Проверьте API-ключ и попробуйте ещё раз."
    });
  }
};
