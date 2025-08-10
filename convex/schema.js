import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  courses: defineTable({
    // Fields from the user/app state
    topic: v.string(),        // The user-entered topic, e.g., "javascript"
    format: v.string(),       // The selected format, e.g., "course"
    createdBy: v.string(),    // The ID of the logged-in user
    showQuestions: v.boolean(), // The value from the checkbox

    // Field from the AI's JSON response
    courseTitle: v.string(),  // Maps to "courseTitle" in the JSON
  })
  .index("by_createdBy", ["createdBy"]),

  modules: defineTable({
    courseId: v.id("courses"),  // Link to the courses table
    moduleId: v.string(),       // The unique ID from the AI, e.g., "javascript-fundamentals"
    title: v.string(),          // e.g., "JavaScript Fundamentals"
    order: v.number()           // The position of this module in the course
  })
  .index("by_courseId", ["courseId"]), // Index to quickly find all modules for a course

  lessons: defineTable({
    moduleId: v.id("modules"),  // Link to the modules table
    lessonId: v.string(),       // The unique ID from the AI, e.g., "javascript-fundamentals-intro"
    title: v.string(),          // e.g., "Introduction to JavaScript..."
    order: v.number()           // The position of this lesson in the module
  })
  .index("by_moduleId", ["moduleId"]), // Index to quickly find all lessons for a module
  
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
    useremail: v.string(), // Add email field for user
    workspace_id: v.optional(v.id("workspaces")), // Optional reference to a workspace (for shared files)
    is_shared: v.optional(v.boolean()), // Whether this file is shared with workspace members
  })
    .index("by_created_by", ["createdBy"])
    .index("by_file_name", ["fileName"])
    .index("by_storage_id", ["storageId"])
    .index("by_workspace_id", ["workspace_id"]), // Add index to look up files by workspace


   
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
    embedding: v.array(v.number()), // Embedding vector (array of floats)

    // Timestamp information
    start: v.number(), // Start time in seconds
    end: v.number(), // End time in seconds
    duration: v.number(), // Duration of chunk
    formattedTimestamp: v.string(), // e.g. "00:00 - 00:30"

    // Optional analytics
    wordCount: v.number(),
    speakingRate: v.number(),

    createdAt: v.number(), // Timestamp (Date.now())
    metadata: v.any(), // Additional metadata if needed
  })
    .index("by_fileId", ["fileId"])
    .index("by_chunkId", ["chunkId"])
    .vectorIndex("byEmbedding", {
      vectorField: "embedding",
      dimensions: 768, // Change to 1536 if your model uses that size
    }),

  // New table for workspaces to manage user collaborations
  workspaces: defineTable({
    workspace_name: v.string(), // A name for the workspace (e.g., "Project Alpha Team")
    owner_id: v.string(), // The user who created the workspace
    email: v.string(), // Owner's email address
    created_at: v.number(), // Timestamp when workspace was created (Date.now())
  })
    .index("by_owner_id", ["owner_id"])
    .index("by_email", ["email"]),
  
  // Table for workspace members (many-to-many relationship)
  workspace_members: defineTable({
    workspace_id: v.id("workspaces"), // Reference to workspace
    user_email: v.string(), // Email of the member
    
    role: v.string(), // Role in workspace (e.g., "admin", "member", "viewer")
    added_at: v.number(), // When they were added to workspace
  })
    .index("by_workspace_id", ["workspace_id"])
    .index("by_user_email", ["user_email"])
    .index("by_workspace_and_user", ["workspace_id", "user_email"]),
});
