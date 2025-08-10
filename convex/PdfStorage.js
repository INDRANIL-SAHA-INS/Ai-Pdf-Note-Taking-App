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



export const get_allthe_documents_with_matching_fileId = query({
  args: {
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`Retrieving all documents for fileId: ${args.fileId}`);

      // Directly query the embedding_documents table to get ALL documents
      // No semantic search needed - just raw database query
      const allDocuments = await ctx.db.query("embedding_documents").collect();
      
      // Filter documents by fileId from metadata
      const filteredDocuments = allDocuments
        .filter(doc => {
          const metadata = doc.metadata;
          return metadata && (metadata.fileId === args.fileId || metadata.fileid === args.fileId);
        })
        .map(doc => doc.text)
        .filter(text => text && text.trim().length > 0); // Remove empty texts

      if (filteredDocuments.length === 0) {
        console.log(`No documents found for fileId: ${args.fileId}`);
        return {
          success: false,
          message: "No documents found for the specified fileId",
          fileId: args.fileId,
          combinedText: "",
          documentCount: 0
        };
      }

      // Combine all text chunks into a single string
      // Simple concatenation with separators for better readability
      const combinedText = filteredDocuments
        .map((text, index) => `--- Document Chunk ${index + 1} ---\n${text}`)
        .join("\n\n");

      console.log(`Successfully retrieved ${filteredDocuments.length} documents for fileId: ${args.fileId}`);
      console.log(`Total combined text length: ${combinedText.length} characters`);
      
      return {
        success: true,
        message: "All documents successfully retrieved and combined",
        fileId: args.fileId,
        combinedText: combinedText,
        documentCount: filteredDocuments.length,
        totalCharacters: combinedText.length
      };

    } catch (error) {
      console.error("Error retrieving documents:", error);
      return {
        success: false,
        message: "Error retrieving documents from database",
        fileId: args.fileId,
        combinedText: "",
        documentCount: 0,
        error: error.message
      };
    }
  },
});

/**
 * Save a PDF file with association to a workspace
 * 
 * @param {string} fileId - The unique ID of the file
 * @param {string} storageId - The storage ID for the file
 * @param {string} createdBy - The user ID who created the file
 * @param {string} fileName - The name of the file
 * @param {string} username - The username of the creator
 * @param {number} createdAt - The timestamp when the file was created
 * @param {string} fileUrl - The URL of the file
 * @param {string} useremail - The email of the creator
 * @param {string} workspace_id - The ID of the workspace to associate with
 * @returns {string} The ID of the newly created PDF file record
 */
export const savePdfFileToWorkspace = mutation({
  args: {
    fileId: v.string(),
    storageId: v.string(),
    createdBy: v.string(),
    fileName: v.string(),
    username: v.string(),
    createdAt: v.number(),
    fileUrl: v.string(),
    useremail: v.string(),
    workspace_id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    // Save PDF file metadata to database with workspace_id
    const pdfFileId = await ctx.db.insert("pdfFiles", {
      fileId: args.fileId,
      storageId: args.storageId,
      createdBy: args.createdBy,
      fileName: args.fileName,
      username: args.username,
      createdAt: args.createdAt,
      fileUrl: args.fileUrl,
      useremail: args.useremail,
      workspace_id: args.workspace_id,
      is_shared: true, // This file is shared within the workspace
    });
    
    return pdfFileId;
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
    // Get all PDF files with this workspace_id
    const files = await ctx.db
      .query("pdfFiles")
      .withIndex("by_workspace_id", (q) => q.eq("workspace_id", args.workspace_id))
      .collect();

    return files;
  },
});

/**
 * Remove a PDF file using its fileId
 * 
 * @param {string} fileId - The unique ID of the file to delete
 * @param {string} user_email - Email of the user attempting to delete the file (for authorization)
 * @returns {object} Status indicating success or failure
 */
export const removePdfFile = mutation({
  args: {
    fileId: v.string(),
    user_email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the file record first
    const fileRecord = await ctx.db
      .query("pdfFiles")
      .filter((q) => q.eq(q.field("fileId"), args.fileId))
      .first();

    if (!fileRecord) {
      throw new Error("File not found");
    }

    // Authorization check: Only the file creator or workspace admin can delete
    if (fileRecord.useremail !== args.user_email) {
      // If file is in a workspace, check if user is admin
      if (fileRecord.workspace_id) {
        const workspace = await ctx.db.get(fileRecord.workspace_id);
        if (!workspace) {
          throw new Error("Associated workspace not found");
        }
        
        // Check if user is workspace owner
        if (workspace.email !== args.user_email) {
          // Check if user is workspace admin
          const membership = await ctx.db
            .query("workspace_members")
            .withIndex("by_workspace_and_user", (q) => 
              q.eq("workspace_id", fileRecord.workspace_id).eq("user_email", args.user_email)
            )
            .first();
            
          if (!membership || membership.role !== "admin") {
            throw new Error("You don't have permission to delete this file");
          }
        }
      } else {
        // Not in workspace and not the creator
        throw new Error("You don't have permission to delete this file");
      }
    }

    // Delete the file from storage
    try {
      await ctx.storage.delete(fileRecord.storageId);
    } catch (storageError) {
      console.error("Error deleting from storage:", storageError);
      // Continue with DB deletion even if storage deletion fails
    }

    // Delete the file record from the database
    await ctx.db.delete(fileRecord._id);

    // Try to delete any associated embeddings
    try {
      // Get all embeddings for this file
      const embeddings = await ctx.db
        .query("embedding_documents")
        .collect();
      
      // Filter embeddings by fileId in metadata
      const fileEmbeddings = embeddings.filter(doc => {
        const metadata = doc.metadata;
        return metadata && (metadata.fileId === args.fileId || metadata.fileid === args.fileId);
      });

      // Delete each embedding
      for (const embedding of fileEmbeddings) {
        await ctx.db.delete(embedding._id);
      }
    } catch (embeddingError) {
      console.error("Error cleaning up embeddings:", embeddingError);
      // Continue with success response even if embedding cleanup fails
    }

    return {
      success: true,
      message: "File deleted successfully",
      fileId: args.fileId
    };
  },
});