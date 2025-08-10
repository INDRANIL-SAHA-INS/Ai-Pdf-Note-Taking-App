import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new workspace
 * 
 * @param {string} workspace_name - Name of the workspace
 * @param {string} owner_id - ID of the user who creates the workspace
 * @param {string} email - Email of the workspace owner
 * @returns {object} The newly created workspace
 */
export const createWorkspace = mutation({
  args: {
    workspace_name: v.string(),
    owner_id: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Create the workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      workspace_name: args.workspace_name,
      owner_id: args.owner_id,
      email: args.email,
      created_at: Date.now(),
    });

    // Add the owner as a member with admin role
    await ctx.db.insert("workspace_members", {
      workspace_id: workspaceId,
      user_email: args.email,
      role: "admin", // Owner is automatically an admin
      added_at: Date.now(),
    });

    // Return the created workspace
    return workspaceId;
  },
});

/**
 * Find all workspaces created by a user (using email)
 * 
 * @param {string} email - Email of the user
 * @returns {Array} List of workspaces created by the user
 */
export const getWorkspacesByOwnerEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find workspaces where the user is the owner
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    return workspaces;
  },
});

/**
 * Find all workspaces that a user is a member of (including ones they don't own)
 * 
 * @param {string} email - Email of the user
 * @returns {Array} List of workspaces the user is a member of
 */
export const getWorkspacesByMemberEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all workspace memberships for this user
    const memberships = await ctx.db
      .query("workspace_members")
      .withIndex("by_user_email", (q) => q.eq("user_email", args.email))
      .collect();

    // Get the actual workspace details for each membership
    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await ctx.db.get(membership.workspace_id);
        return {
          ...workspace,
          role: membership.role,
        };
      })
    );

    return workspaces;
  },
});

/**
 * Add a member to a workspace
 * 
 * @param {string} workspace_id - ID of the workspace
 * @param {string} user_email - Email of the user to add
 * @param {string} role - Role to assign to the user (default: "member")
 * @returns {object} The created membership
 */
export const addMemberToWorkspace = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    user_email: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First, check if the workspace exists
    const workspace = await ctx.db.get(args.workspace_id);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Check if the user is already a member
    const existingMembership = await ctx.db
      .query("workspace_members")
      .withIndex("by_workspace_and_user", (q) => 
        q.eq("workspace_id", args.workspace_id).eq("user_email", args.user_email)
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this workspace");
    }

    // Add the user as a member
    const membershipId = await ctx.db.insert("workspace_members", {
      workspace_id: args.workspace_id,
      user_email: args.user_email,
      role: args.role || "member", // Default role is member
      added_at: Date.now(),
    });

    return membershipId;
  },
});

/**
 * Get all members of a workspace
 * 
 * @param {string} workspace_id - ID of the workspace
 * @returns {Array} List of members in the workspace
 */
export const getWorkspaceMembers = query({
  args: {
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    // Check if the workspace exists
    const workspace = await ctx.db.get(args.workspace_id);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Get all members
    const members = await ctx.db
      .query("workspace_members")
      .withIndex("by_workspace_id", (q) => q.eq("workspace_id", args.workspace_id))
      .collect();

    return members;
  },
});

/**
 * Remove a member from a workspace
 * 
 * @param {string} workspace_id - ID of the workspace
 * @param {string} user_email - Email of the user to remove
 * @returns {boolean} Success status
 */
export const removeMemberFromWorkspace = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    user_email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the membership
    const membership = await ctx.db
      .query("workspace_members")
      .withIndex("by_workspace_and_user", (q) => 
        q.eq("workspace_id", args.workspace_id).eq("user_email", args.user_email)
      )
      .first();

    if (!membership) {
      throw new Error("Member not found in workspace");
    }

    // Check if this is the owner (prevent removing the owner)
    const workspace = await ctx.db.get(args.workspace_id);
    if (workspace.email === args.user_email) {
      throw new Error("Cannot remove the workspace owner");
    }

    // Delete the membership
    await ctx.db.delete(membership._id);

    return true;
  },
});

/**
 * Update workspace name
 * 
 * @param {string} workspace_id - ID of the workspace
 * @param {string} new_name - New name for the workspace
 * @returns {object} Updated workspace
 */
export const updateWorkspaceName = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    new_name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if workspace exists
    const workspace = await ctx.db.get(args.workspace_id);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Update the workspace name
    await ctx.db.patch(args.workspace_id, {
      workspace_name: args.new_name,
    });

    return await ctx.db.get(args.workspace_id);
  },
});

/**
 * Get a workspace by ID
 * 
 * @param {string} workspace_id - ID of the workspace
 * @returns {object} The workspace details
 */
export const getWorkspaceById = query({
  args: {
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspace_id);
    
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    
    // Get member count
    const members = await ctx.db
      .query("workspace_members")
      .withIndex("by_workspace_id", (q) => q.eq("workspace_id", args.workspace_id))
      .collect();
    
    return {
      ...workspace,
      memberCount: members.length
    };
  },
});

/**
 * Get all PDF files associated with a workspace
 * 
 * @param {string} workspace_id - ID of the workspace
 * @returns {Array} List of PDF files in the workspace
 */
export const getPdfFilesByWorkspace = query({
  args: {
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    // Check if the workspace exists
    const workspace = await ctx.db.get(args.workspace_id);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Get all PDF files with this workspace_id
    const files = await ctx.db
      .query("pdfFiles")
      .withIndex("by_workspace_id", (q) => q.eq("workspace_id", args.workspace_id))
      .collect();

    return files;
  },
});
