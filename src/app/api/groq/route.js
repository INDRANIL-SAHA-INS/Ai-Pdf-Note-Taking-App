// src/app/api/groq/route.js
import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const { messages, model } = await request.json();

    // Input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required." }), { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Groq API key missing." }), { status: 500 });
    }

    const client = new Groq({ api_key: apiKey });
    const response = await client.chat.completions.create({
      model: model || "llama3-8b-8192",
      messages,
    });

    if (!response.choices || !Array.isArray(response.choices) || !response.choices[0] || !response.choices[0].message || typeof response.choices[0].message.content !== "string") {
      return new Response(JSON.stringify({
        error: "No valid response from Groq",
      }), { status: 500 });
    }

    return new Response(JSON.stringify({ content: response.choices[0].message.content }), { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body." }), { status: 400 });
    }

    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), { status: 500 });
  }
}