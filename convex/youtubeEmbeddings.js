
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { internal } from "./_generated/api";


import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";

import { retrieveFullTranscript,retrieveTopKChunks } from "./helper_functions/retrieveTopKChunks";

// Action to search YouTube transcript embeddings by query and fileId (using ConvexVectorStore)


export const searchYoutubeTranscriptEmbeddings = action({
  args: {
    query: v.string(),
    fileId: v.string(),
    queryType: v.string(), // expected: specific_question, summarization, instruction, general_question, other
  },

  handler: async (ctx, args) => {
    console.log("Node.js environment detected:", typeof process !== 'undefined' && !!process.env);
    console.log("Node.js version:", process.version);
    console.log("Environment variables available:", Object.keys(process.env).length);
    console.log("Looking for GOOGLE_GENAI_API_KEY in environment");

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_GENAI_API_KEY environment variable is not set or not accessible in search function");
      throw new Error("Google Generative AI API key is not configured. Please set the GOOGLE_GENAI_API_KEY environment variable.");
    }

    const vectorStore = new ConvexVectorStore(
      new GoogleGenerativeAIEmbeddings({
        apiKey: apiKey,
        model: "text-embedding-004",
        taskType: "RETRIEVAL_DOCUMENT",
        title: "YouTube Transcript Search",
      }),
      {
        ctx,
        table: "youtubeTranscriptEmbeddings",
      }
    );

    let pageContents = [];

    switch (args.queryType) {
      case "specific_question":
        console.log("Matched case: specific_question");
        pageContents = await retrieveTopKChunks(vectorStore, args, 3);
        break;

      case "general_question":
        console.log("Matched case: general_question");
        pageContents = await retrieveTopKChunks(vectorStore, args, 5);
        break;

      case "instruction":
        console.log("Matched case: instruction");
        pageContents = await retrieveTopKChunks(vectorStore, args, 8);
        break;

      case "summarization":
        console.log("Matched case: summarization");
        pageContents = await retrieveFullTranscript(vectorStore, args);
        break;

      case "other":
        console.log("Matched case: other");
        pageContents = await retrieveTopKChunks(vectorStore, args, 10);
        break;

      default:
        console.log("Matched case: default (fallback)");
        pageContents = await retrieveTopKChunks(vectorStore, args, 10);
        break;
    }

    console.log("Final page contents:", pageContents);
    return JSON.stringify(pageContents);
  },
});

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
    
    // Properly use environment variable without hardcoding the API key
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    console.log("API key from environment:", apiKey ? "Available (secure)" : "NOT AVAILABLE");
    
    // Security check - make sure we have an API key from environment
    if (!apiKey) {
      console.error("GOOGLE_GENAI_API_KEY environment variable is not set or not accessible");
      console.error("Available environment variables (keys only):", Object.keys(process.env));
      console.error("This is a critical security issue - API keys should never be hardcoded");
      console.error("Check if .env.local file is being properly loaded in your Convex deployment");
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
