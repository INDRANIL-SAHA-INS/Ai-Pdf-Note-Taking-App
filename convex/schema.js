import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  
  youtubeVideos: defineTable({
    url: v.string(), // The YouTube video URL
    createdBy: v.string(), // User who uploaded
    createdAt: v.number(), // Timestamp
    title: v.optional(v.string()), // Optional: video title (can be filled later)
    description: v.optional(v.string()), // Optional: video description (can be filled later)
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_url", ["url"]),
  users: defineTable({
    username: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"]),
    
  pdfFiles: defineTable({
    fileId: v.string(),
    storageId: v.string(),
    createdBy: v.string(),
    fileName: v.string(),
    createdAt: v.number(),
    username: v.string(),
    fileUrl: v.string(),

  })
    .index("by_created_by", ["createdBy"])
    .index("by_file_name", ["fileName"])
    .index("by_storage_id", ["storageId"]),


   
  embedding_documents: defineTable({
    embedding: v.array(v.number()),
    text: v.string(),
    metadata: v.any(),
  }).vectorIndex("byEmbedding", {
    vectorField: "embedding",
    dimensions: 768,
  }),


  editorData: defineTable({
    fileId: v.string(),
    createdBy: v.string(),
    data: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_fileId", ["fileId"])
    .index("by_createdBy", ["createdBy"]),

  youtubeTranscriptEmbeddings: defineTable({
    fileId: v.string(), // References _id from files table
    chunkId: v.number(), // Index of the chunk (0, 1, 2, ...)
    text: v.string(), // Raw chunk text
    embeddingText: v.string(), // Text formatted for embedding
    embedding: v.any(), // Embedding vector (array of floats)

    // Timestamp information
    start: v.number(), // Start time in seconds
    end: v.number(), // End time in seconds
    duration: v.number(), // Duration of chunk
    formattedTimestamp: v.string(), // e.g. "00:00 - 00:30"

    // Optional analytics
    wordCount: v.number(),
    speakingRate: v.number(),

    createdAt: v.number(), // Timestamp (Date.now())
  })
    .index("by_fileId", ["fileId"])
    .index("by_chunkId", ["chunkId"]),
});
