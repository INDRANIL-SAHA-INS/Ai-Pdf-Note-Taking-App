// src/app/api/groq/route.js
import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const { query, messages, model } = await request.json();

    // If a query is provided, classify its type using Groq
    if (query) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "Groq API key missing." }), { status: 500 });
      }
      const client = new Groq({ api_key: apiKey });
     const classifyPrompt = [
  {
    role: "system",
    content: `
You are a highly accurate query classifier.

Your task is to classify the user's query into exactly one of the following categories:

1. specific_question – A question asking for a specific fact, detail, or small piece of information.
   Example: "What color is the speaker’s shirt?"

2. summarization – A request to summarize, condense, or provide an overview of the content.
   Example: "Summarize the video."

3. instruction – A request to generate, rewrite, translate, or reformat content creatively or structurally.
   Example: "Write a tweet about this video."

4. general_question – A broad or open-ended question not focused on a specific detail.
   Example: "What is the speaker talking about overall?"

5. other – Anything that does not clearly fit into the above categories.

Respond with exactly **one word**: the category name (e.g., specific_question). Do not include any explanation, punctuation, or formatting — just the raw category name.
`
  },
  {
    role: "user",
    content: query
  }
];

      const response = await client.chat.completions.create({
        model: model || "llama-3.3-70b-versatile",
        messages: classifyPrompt,
      });
      if (!response.choices || !Array.isArray(response.choices) || !response.choices[0] || !response.choices[0].message || typeof response.choices[0].message.content !== "string") {
        return new Response(JSON.stringify({ error: "No valid response from Groq" }), { status: 500 });
      }
      return new Response(JSON.stringify({ type: response.choices[0].message.content.trim() }), { status: 200 });
    }

    // If messages are provided, do chat completion
    if (messages && Array.isArray(messages) && messages.length > 0) {
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
        return new Response(JSON.stringify({ error: "No valid response from Groq" }), { status: 500 });
      }
      return new Response(JSON.stringify({ content: response.choices[0].message.content }), { status: 200 });
    }

    // If neither query nor messages are provided, return error
    return new Response(JSON.stringify({ error: "Either 'query' or 'messages' is required." }), { status: 400 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body." }), { status: 400 });
    }

    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), { status: 500 });
  }
}