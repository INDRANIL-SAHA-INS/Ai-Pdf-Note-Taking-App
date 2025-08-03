import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation to add a new YouTube video URL to the database
export const addYoutubeVideo = mutation({
  args: {
    url: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("youtubeVideos", {
      url: args.url,
      createdBy: args.createdBy,
      createdAt: args.createdAt,
      title: args.title,
      description: args.description,
    });
    return id;
  },
});


// Query to fetch a YouTube video record by _id
export const getYoutubeVideoById = query({
  args: { _id: v.id("youtubeVideos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args._id);
    if (!video) return null;
    // Return the whole record (url, title, description, etc.)
    return video;
  },
});
