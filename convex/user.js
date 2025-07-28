import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addUser = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists by email
    const existingUserByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUserByEmail) {
      throw new Error("User with this email already exists");
    }

    // Check if username is already taken
    const existingUserByUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUserByUsername) {
      throw new Error("Username is already taken");
    }

    // If both email and username are unique, create new user
    const userId = await ctx.db.insert("users", {
      username: args.username,
      email: args.email,
      imageUrl: args.imageUrl,
    });
    console.log("New user created with ID:", userId);
    return userId;
  },
});