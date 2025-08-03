import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


// Upsert mutation: update if fileId exists, otherwise insert new
export const upsertEditorData = mutation({
  args: {
    fileId: v.string(),
    createdBy: v.string(),
    data: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const [doc] = await ctx.db
      .query("editorData")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.fileId))
      .collect();
    if (doc) {
      await ctx.db.patch(doc._id, {
        data: args.data,
        updatedAt: args.updatedAt,
      });
      return { _id: doc._id, updated: true };
    } else {
      const newId = await ctx.db.insert("editorData", {
        fileId: args.fileId,
        createdBy: args.createdBy,
        data: args.data,
        createdAt: args.createdAt,
        updatedAt: args.updatedAt,
      });
      return { _id: newId, updated: false };
    }
  },
});

// Query to fetch editor data by fileId (for loading in the editor)
export const getEditorDataByFileId = query({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    const [doc] = await ctx.db
      .query("editorData")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.fileId))
      .collect();
    return doc || null;
  },
});

