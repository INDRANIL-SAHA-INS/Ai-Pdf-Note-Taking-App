"use node";

import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
import { action } from "./_generated/server.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { v } from "convex/values";
import { retrieveFullTranscript,retrieveTopKChunks } from "./helper_functions/retrieveTopKChunks.js"; 

export const ingest = action({
  args: {
    splittext: v.any(),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    // Early validation
    if (!args.splittext || !Array.isArray(args.splittext) || args.splittext.length === 0) {
      console.error("Invalid or empty splittext received");
      return {
        success: false,
        message: "No text chunks provided for embedding",
        fileId: args.fileId,
        chunksProcessed: 0,
        error: "Empty or invalid text data"
      };
    }
    
    try {
      // Check environment variable status for debugging
      console.log("Environment check for action.js/ingest:");
      console.log("GOOGLE_GENAI_API_KEY available:", !!process.env.GOOGLE_GENAI_API_KEY);
      console.log("Environment variables count:", Object.keys(process.env).length);
      
      // Security check - API key must come from environment
      const apiKey = process.env.GOOGLE_GENAI_API_KEY;
      if (!apiKey) {
        console.error("GOOGLE_GENAI_API_KEY environment variable is not set or not accessible");
        console.error("This is a critical security issue - API keys should never be hardcoded");
        console.error("Check if .env.local file is being properly loaded in your Convex deployment");
        throw new Error("API key not found in environment variables. Aborting for security reasons.");
      }
      
      // Create metadata array for each chunk
      const metadataArray = args.splittext.map(() => ({ fileid: args.fileId }));
      
      await ConvexVectorStore.fromTexts(
        args.splittext,
        metadataArray, // Pass array of metadata objects
        new GoogleGenerativeAIEmbeddings({
          apiKey: apiKey, // Use the verified environment variable
          model: "text-embedding-004",
          taskType: TaskType.RETRIEVAL_DOCUMENT,
          title: "Document title",
        }),
        { 
          ctx,
          table: "embedding_documents"
        }
      );
      
      return {
        success: true,
        message: "Documents successfully embedded and stored",
        fileId: args.fileId,
        chunksProcessed: args.splittext.length
      };
    } catch (error) {
      console.error("Error in embedding process:", error);
      return {
        success: false,
        message: "Error processing embeddings",
        fileId: args.fileId,
        chunksProcessed: 0,
        error: error.message
      };
    }
  },
});

export const search = action({
  args: {
    query: v.string(),
    fileId: v.string(),
    queryType: v.string(), // allow queryType for flexible retrieval
  },
  handler: async (ctx, args) => {
    // Check environment variable status for debugging
    console.log("Environment check for action.js/search:");
    console.log("GOOGLE_GENAI_API_KEY available:", !!process.env.GOOGLE_GENAI_API_KEY);

    // Security check - API key must come from environment
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_GENAI_API_KEY environment variable is not set or not accessible in search function");
      console.error("This is a critical security issue - API keys should never be hardcoded");
      throw new Error("API key not found in environment variables. Aborting search for security reasons.");
    }

    const vectorStore = new ConvexVectorStore(
      new GoogleGenerativeAIEmbeddings({
        apiKey: apiKey,
        model: "text-embedding-004",
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "Document Search",
      }),
      {
        ctx,
        table: "embedding_documents",
      }
    );

    let pageContents = [];
    // Use queryType to decide retrieval strategy
    switch (args.queryType) {
      case "summarization":
        console.log("Matched case: summarization");
        pageContents = await retrieveFullTranscript(vectorStore, args);
        break;
      case "specific_question":
        console.log("Matched case: specific_question");
        pageContents = await retrieveTopKChunks(vectorStore, args, 12);
        break;
      case "general_question":
        console.log("Matched case: general_question");
        pageContents = await retrieveTopKChunks(vectorStore, args, 18);
        break;
      case "instruction":
        console.log("Matched case: instruction");
        pageContents = await retrieveTopKChunks(vectorStore, args, 18);
        break;
      case "other":
        console.log("Matched case: other");
        pageContents = await retrieveTopKChunks(vectorStore, args, 20);
        break;
      default:
        console.log("Matched case: default (fallback)");
        pageContents = await retrieveTopKChunks(vectorStore, args, 30);
        break;
    }

    console.log("This is my pageContents:", pageContents);
    // Store the final result as a string
    const finalResult = JSON.stringify(pageContents);
    return finalResult;
  }
});