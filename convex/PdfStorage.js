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
    fileUrl: v.string(), // Add fileUrl to the arguments
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

