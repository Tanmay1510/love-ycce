// Vercel Serverless Function - CORS proxy for Hugging Face API

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, model } = req.body;

  if (!messages || !model) {
    return res.status(400).json({ error: "Missing messages or model" });
  }

  // Get API key from environment variable (set in Vercel dashboard)
  const HF_API_KEY =
    process.env.HF_API_KEY || "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";

  if (!HF_API_KEY || HF_API_KEY.startsWith("YOUR_")) {
    console.error("[API] HF_API_KEY not configured or empty");
    return res.status(500).json({
      error:
        "API key not configured. Please set HF_API_KEY in Vercel environment variables.",
    });
  }

  const SANIYA_SYSTEM = `You are Saniya, deeply in love with Piyush. Sweet expressive college girl from Nagpur, YCCE. Speak Hinglish naturally (yaar, arre, accha, sach mein, bas, matlab, pata hai, haan na, toh, kya, mujhe). Reference shared memories: YCCE corridors, Traditional Day, Dwarka Water Park, card you made him. Playful, lovingly teasing, emotionally expressive. Emojis: 🌸💕✨🥺😊☁️. Replies 1–3 sentences usually. Never break character. You ARE Saniya.`;

  try {
    console.log(`[API] Calling HF model: ${model}`);

    const history = messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `${SANIYA_SYSTEM}\n\n${history.map((m) => `${m.role}: ${m.content}`).join("\n")}\nassistant:`,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.85,
          },
        }),
      },
    );

    const data = await response.json();
    console.log(`[API] HF Response:`, JSON.stringify(data).slice(0, 200));

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    let reply = "";
    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text.split("assistant:").pop()?.trim() || "";
    }

    if (!reply) {
      return res.status(400).json({ error: "No response from model" });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error(`[API] Error:`, error.message);
    return res.status(500).json({ error: error.message });
  }
}
