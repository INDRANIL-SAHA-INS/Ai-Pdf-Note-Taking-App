"use node";

import { ConvexVectorStore } from "@langchain/community/vectorstores/convex";
import { action } from "./_generated/server.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { v } from "convex/values";

export const ingest = action({
  args: {
    splittext: v.any(),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    await ConvexVectorStore.fromTexts(
      args.splittext, // ✅ Use the split text directly
      args.fileId, // ✅ Use the fileId directly
      new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_GENAI_API_KEY,
        model: "text-embedding-004",
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "Document title",
      }),
      { 
        ctx,
        table: "embedding_documents" // ✅ Specify your custom table name
      }
    );
    
    // ✅ Return success message
    return {
      success: true,
      message: "Documents successfully embedded and stored",
      fileId: args.fileId,
      chunksProcessed: args.splittext.length
    };
  },
});