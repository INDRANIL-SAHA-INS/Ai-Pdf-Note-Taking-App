import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const savePdfFile = mutation({
  args: {
    fileId: v.string(),
    storageId: v.string(),
    createdBy: v.string(),
    fileName: v.string(),
    username: v.string(),
    createdAt: v.number(),
    fileUrl: v.string(),
    useremail: v.string(),
  },
  handler: async (ctx, args) => {
    // Save PDF file metadata to database
    const pdfFileId = await ctx.db.insert("pdfFiles", {
      fileId: args.fileId,
      storageId: args.storageId,
      createdBy: args.createdBy,
      fileName: args.fileName,
      username: args.username,
      createdAt: args.createdAt,
      fileUrl: args.fileUrl,
      useremail: args.useremail,
    });
    
    return pdfFileId;
  },
});

export const getFileUrl = mutation({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch the file metadata from the database
   

    // Generate the actual file URL using the storage ID
    const fileUrl = await ctx.storage.getUrl(args.storageId);

    if (!fileUrl) {
      throw new Error("Could not generate file URL");
    }

    return fileUrl;
  },
});

export const getfilerecord = query({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    // Fetch the file metadata from the database by fileId field
    const fileRecord = await ctx.db
      .query("pdfFiles")
      .filter((q) => q.eq(q.field("fileId"), args.fileId))
      .first();

    if (!fileRecord) {
      throw new Error("File not found");
    }

    return fileRecord;
  },
});
export const getPdfFilesByUser_email = query({
  args: { useremail: v.string() },
  handler: async (ctx, args) => {
    // Find all pdfFiles where useremail matches the given email
    const files = await ctx.db
      .query("pdfFiles")
      .filter(q => q.eq(q.field("useremail"), args.useremail))
      .collect();
    return files;
  },
});