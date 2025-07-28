import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
});