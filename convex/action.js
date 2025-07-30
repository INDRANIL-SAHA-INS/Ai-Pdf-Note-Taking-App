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
    // Create metadata array for each chunk
    const metadataArray = args.splittext.map(() => ({ fileid: args.fileId }));

    await ConvexVectorStore.fromTexts(
      args.splittext,
      metadataArray, // Pass array of metadata objects
      new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_GENAI_API_KEY,
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
  },
});

export const search = action({
  args: {
    query: v.string(),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    const vectorStore = new ConvexVectorStore(
      new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_GENAI_API_KEY,
        model: "text-embedding-004",
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "Document Search",
      }),
      {
        ctx,
        table: "embedding_documents",
    }
  );

  const results = await vectorStore.similaritySearch(args.query, 1);
  console.log(results);

  const filteredResults = results.filter(doc => doc.metadata?.fileid === args.fileId);

  return JSON.stringify(filteredResults);
}
});