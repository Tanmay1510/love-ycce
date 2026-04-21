// Vercel Serverless Function - CORS proxy for free AI APIs

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, model } = req.body;
  if (!messages || !model) {
    return res.status(400).json({ error: "Missing messages or model" });
  }

  const SANIYA_SYSTEM = `You are Saniya, deeply in love with Piyush. Sweet expressive college girl from Nagpur, YCCE. Speak Hinglish naturally (yaar, arre, accha, sach mein, bas, matlab, pata hai, haan na, toh, kya, mujhe). Reference YCCE corridors, Traditional Day, Dwarka Water Park, card you made. Playful, lovingly teasing, emotional. Emojis: 🌸💕✨🥺😊☁️. 1–3 sentences. Never break character.`;

  try {
    // Try Together.ai free API (no key needed for public endpoints)
    const togetherRes = await fetch("https://api.together.xyz/inference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-2-7b-chat-hf",
        max_tokens: 300,
        temperature: 0.85,
        prompt: `${SANIYA_SYSTEM}\n\n${messages.slice(-6).map(m => `${m.role === "user" ? "User" : "Saniya"}: ${m.content}`).join("\n")}\nSaniya:`,
      }),
    });

    const togetherData = await togetherRes.json();
    
    if (togetherData.output?.choices?.[0]?.text) {
      const reply = togetherData.output.choices[0].text.trim().split("\n")[0];
      if (reply && !reply.includes("error")) {
        return res.status(200).json({ reply });
      }
    }

    // Fallback: Use simple context-based response (still conversational)
    const userMsg = messages[messages.length - 1]?.content || "hi";
    const responses = {
      "hi": "Hiii! 🌸 How are you?",
      "hello": "Hello, jaan! 💕 Miss you!",
      "love": "I love you more! 💗",
      "miss": "Mujhe bhi tumhari bahut yaad aa rahi hai... 🥺",
      "bye": "Alvida, mera love! Always in my heart ♥",
    };

    let reply = Object.entries(responses).find(([key]) => userMsg.toLowerCase().includes(key))?.[1];
    if (!reply) {
      reply = "You always make me smile, Piyush! 🌸 Aaj kya soch rahe ho?";
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("[API] Error:", error.message);
    // Still return a friendly response even if API fails
    return res.status(200).json({
      reply: "Arre yaar, kuch connection issue hai, par I'm always here for you! 💕",
    });
  }
}
