
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { internal } from "./_generated/api";

// Action to store YouTube transcript embeddings
export const addYoutubeTranscriptEmbeddings = action({
  args: {
    fileId: v.string(),
    chunks: v.array(
      v.object({
        id: v.number(),
        text: v.string(),
        embeddingText: v.string(),
        embedding: v.optional(v.any()), // Embedding vector (array of floats)
        timestamp: v.object({
          start: v.number(),
          end: v.number(),
          duration: v.number(),
          formatted: v.string(),
        }),
        analytics: v.object({
          word_count: v.number(),
          speaking_rate: v.number(),
        }),
        createdAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Log environment info
    console.log("Node.js environment detected:", typeof process !== 'undefined' && !!process.env);
    console.log("Node.js version:", process.version);
    console.log("Environment variables available:", Object.keys(process.env).length);
    console.log("Looking for GOOGLE_GENAI_API_KEY in environment");
    
    // Directly attempt to use the API key from .env.local
    const apiKey = process.env.GOOGLE_GENAI_API_KEY || "AIzaSyDL0eRD3itgACG4se8NsuPqC8XcWsAl48Y";
    console.log("API key available:", !!apiKey);
    console.log("Starting embedding generation with API key");
    
    if (!apiKey) {
      console.error("GOOGLE_GENAI_API_KEY environment variable is not set");
      // Log all available environment variables (excluding their values for security)
      console.error("Available environment variables:", Object.keys(process.env));
      throw new Error("Google Generative AI API key is not configured. Please set the GOOGLE_GENAI_API_KEY environment variable.");
    }
    
    // Prepare embedding model
    const embeddingModel = new GoogleGenerativeAIEmbeddings({
      apiKey: apiKey,
      model: "text-embedding-004",
      taskType: "RETRIEVAL_DOCUMENT",
      title: "YouTube Transcript Chunk",
    });

    const insertedIds = [];
    for (const chunk of args.chunks) {
      let embedding = chunk.embedding;
      // If embedding is not present, generate it
      if (!embedding) {
        const textForEmbedding = chunk.embeddingText || chunk.text;
        if (!textForEmbedding) {
          console.error("No text available for embedding in chunk", chunk.id);
          throw new Error(`No text available for embedding in chunk ${chunk.id}`);
        }
        
        try {
          console.log(`Generating embedding for chunk ${chunk.id} with text length ${textForEmbedding.length}`);
          const result = await embeddingModel.embedQuery(textForEmbedding);
          embedding = result;
          console.log("Embedding generated for chunk", chunk.id, "length:", embedding.length);
        } catch (e) {
          console.error("Embedding generation failed for chunk", chunk.id, e);
          console.error("Error details:", {
            name: e.name,
            message: e.message,
            stack: e.stack
          });
          throw new Error(`Embedding generation failed for chunk ${chunk.id}: ${e?.message || e}`);
        }
      } else {
        console.log("Embedding already present for chunk", chunk.id);
      }
      
      try {
        // Use internal mutation to insert into database instead of direct db access
        console.log("About to call internal mutation to insert chunk", chunk.id);
        const id = await ctx.runMutation(internal.internal.insertTranscriptEmbeddings, {
          fileId: args.fileId,
          chunkId: chunk.id,
          text: chunk.text,
          embeddingText: chunk.embeddingText,
          embedding,
          start: chunk.timestamp.start,
          end: chunk.timestamp.end,
          duration: chunk.timestamp.duration,
          formattedTimestamp: chunk.timestamp.formatted,
          wordCount: chunk.analytics.word_count,
          speakingRate: chunk.analytics.speaking_rate,
          createdAt: chunk.createdAt,
        });
        console.log("Successfully inserted chunk row with id", id, "for chunk", chunk.id);
        insertedIds.push(id);
      } catch (e) {
        console.error("Failed to insert chunk", chunk.id, "Error:", e);
        console.error("Error details:", {
          name: e.name,
          message: e.message,
          stack: e.stack
        });
        throw new Error(`Failed to insert chunk ${chunk.id}: ${e?.message || e}`);
      }
    }
    console.log("Inserted total rows:", insertedIds.length);
    return { success: true, inserted: insertedIds.length, ids: insertedIds };
  },
});
