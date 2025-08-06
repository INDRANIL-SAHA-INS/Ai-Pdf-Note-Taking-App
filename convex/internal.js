import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Internal mutation to actually insert transcript embeddings into the database
// This will be called by the action
export const insertTranscriptEmbeddings = internalMutation({
  args: {
    fileId: v.string(),
    chunkId: v.number(),
    text: v.string(),
    embeddingText: v.string(),
    embedding: v.any(),
    start: v.number(),
    end: v.number(),
    duration: v.number(),
    formattedTimestamp: v.string(),
    wordCount: v.number(),
    speakingRate: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("youtubeTranscriptEmbeddings", {
      fileId: args.fileId,
      chunkId: args.chunkId,
      text: args.text,
      embeddingText: args.embeddingText,
      embedding: args.embedding,
      start: args.start,
      end: args.end,
      duration: args.duration,
      formattedTimestamp: args.formattedTimestamp,
      wordCount: args.wordCount,
      speakingRate: args.speakingRate,
      createdAt: args.createdAt,
      metadata: { fileId: args.fileId }, // <-- Add this line
    });
  },
});
