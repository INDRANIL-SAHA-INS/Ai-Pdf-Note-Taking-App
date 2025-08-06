"use client";
import axios from "axios";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";




import { useMutation, useAction } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "convex/_generated/api";
const UploadYoutubeDialoguebox = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(""); // Status message to show during upload
  const [isCancelled, setIsCancelled] = useState(false); // Track if user has cancelled
  const { user } = useUser();
  const addYoutubeVideo = useMutation(api.youtube.addYoutubeVideo);
  const addYoutubeTranscriptEmbeddings = useAction(api.youtubeEmbeddings.addYoutubeTranscriptEmbeddings);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) {
      alert("Please enter a YouTube URL.");
      return;
    }
    if (!user) {
      alert("You must be signed in to upload a YouTube URL.");
      return;
    }
    
    // Reset cancellation state at the start of a new upload
    setIsCancelled(false);
    setLoading(true);
    setStatus("Starting upload process...");
    try {
      // Step 1: Extract video ID from URL
      const videoIdMatch = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/videos\/|.*\/embed\/|.*\/shorts\/|.*\/watch\?v=))([^"&?\/\s]{11})/);
      if (!videoIdMatch) {
        alert("Invalid YouTube URL. Please enter a valid YouTube video URL.");
        setLoading(false);
        return;
      }
      const videoId = videoIdMatch[1];

      // Step 2: Fetch transcript from Flask API
      console.log("Fetching transcript for video ID:", videoId);
      setStatus("Fetching transcript data...");
      
      // Check if cancelled
      if (isCancelled) {
        console.log("Process cancelled by user during initialization");
        setLoading(false);
        setStatus("");
        return;
      }
      
      let transcriptData = null;
      try {
        const apiResponse = await axios.get(`http://127.0.0.1:5000/transcript?video_id=${videoId}`, { timeout: 10000 });
        if (!apiResponse.data.success) {
          console.error("API returned error:", apiResponse.data.error);
          setLoading(false);
          // Show a more friendly error message
          alert("We couldn't get the transcript for this video. The video might not have captions available or they might be disabled.");
          return;
        }
        transcriptData = apiResponse.data.data;
      } catch (error) {
        console.error("Transcript API request failed:", error);
        // Check specific error types for better messages
        if (error.code === 'ECONNABORTED') {
          alert("The request timed out. Please check if the transcript service is running and try again.");
        } else if (error.code === 'ERR_NETWORK') {
          alert("Can't connect to the transcript service. Please make sure the transcript service is running at http://127.0.0.1:5000");
        } else if (error.response && error.response.status === 400) {
          alert("We couldn't process this YouTube video. It may not have available transcripts or captions.");
        } else {
          alert("There was a problem getting the transcript: " + (error.message || "Unknown error"));
        }
        setLoading(false);
        return;
      }
      
      // Validate transcript data structure
      if (!transcriptData || !transcriptData.transcript || !transcriptData.transcript.chunks) {
        console.error("Invalid transcript data structure:", transcriptData);
        alert("The transcript data couldn't be processed. You can still save the video link without transcript data.");
        
        // Ask user if they want to continue without transcript
        if (!confirm("Do you want to continue saving the video link without transcript data?")) {
          setLoading(false);
          return;
        }
        // Create empty chunks array to allow continuing without transcript
        transcriptData = { transcript: { chunks: [] } };
      }
      
      // Validate chunk structure
      let validChunks = [];
      if (transcriptData.transcript.chunks && transcriptData.transcript.chunks.length > 0) {
        validChunks = transcriptData.transcript.chunks.filter(chunk => {
          const isValid = chunk && 
                          typeof chunk.id === 'number' && 
                          chunk.text && 
                          chunk.timestamp && 
                          typeof chunk.timestamp.start === 'number' && 
                          typeof chunk.timestamp.end === 'number' && 
                          typeof chunk.timestamp.duration === 'number' &&
                          chunk.analytics &&
                          typeof chunk.analytics.word_count === 'number';
          
          if (!isValid) {
            console.warn("Found invalid chunk:", chunk);
          }
          return isValid;
        });
        
        console.log(`Transcript data processed: Valid chunks: ${validChunks.length}/${transcriptData.transcript.chunks.length}`);
      }
      
      // Replace chunks with validated chunks
      transcriptData.transcript.chunks = validChunks;
      
      // Check if cancelled before proceeding to save
      if (isCancelled) {
        console.log("Process cancelled by user after transcript processing");
        setLoading(false);
        setStatus("");
        return;
      }
      
      // Warn user if no valid chunks were found but continue with video upload
      if (validChunks.length === 0) {
        console.warn("No valid transcript chunks found");
        if (transcriptData.transcript.chunks && transcriptData.transcript.chunks.length > 0) {
          // Only show warning if there were chunks but none were valid
          if (!confirm("No valid transcript chunks could be processed. Do you want to continue saving just the video link?")) {
            setLoading(false);
            return;
          }
        }
      }

      // Step 2: Upload video info to Convex and get _id first (separate from embeddings)
      console.log("About to call addYoutubeVideo mutation");
      setStatus("Saving video information...");
      
      // Check if cancelled before saving video metadata
      if (isCancelled) {
        console.log("Process cancelled by user before saving video metadata");
        setLoading(false);
        setStatus("");
        return;
      }
      
      const docId = await addYoutubeVideo({
        url: youtubeUrl,
        createdBy: user.primaryEmailAddress?.emailAddress || "unknown_user",
        createdAt: Date.now(),
        title: title || undefined,
        description: description || undefined,
      });
      console.log("Video saved to Convex. Returned ID:", docId);
      console.log("ID type:", typeof docId);
      
      // Video is saved, now we can proceed with embeddings if there are valid chunks
      // Check if we should proceed with embeddings
      if (transcriptData.transcript.chunks.length === 0) {
        // No chunks to process, just finish the process
        setOpen(false);
        setYoutubeUrl("");
        setTitle("");
        setDescription("");
        setStatus("");
        alert("YouTube video link saved successfully! No transcript data was available.");
        setLoading(false);
        return;
      }
      
      // Check if cancelled before proceeding to embeddings
      if (isCancelled) {
        console.log("Process cancelled by user after saving video metadata");
        setOpen(false);
        setYoutubeUrl("");
        setTitle("");
        setDescription("");
        setStatus("");
        alert("YouTube video link saved successfully! Embedding process was cancelled.");
        setLoading(false);
        return;
      }
      
      // Ask user permission before proceeding with embeddings
      const proceedWithEmbeddings = confirm(
        `Video saved. Process ${transcriptData.transcript.chunks.length} transcript chunks for search capabilities?`
      );
      
      if (!proceedWithEmbeddings) {
        console.log("User opted not to proceed with embeddings");
        setOpen(false);
        setYoutubeUrl("");
        setTitle("");
        setDescription("");
        setStatus("");
        alert("YouTube video saved! Embedding process skipped.");
        setLoading(false);
        return;
      }

      // Step 3: Process transcript chunks for embeddings
      console.log("Checking conditions for Step 3:", {
        hasFileId: Boolean(docId),
        hasChunks: Boolean(transcriptData.transcript.chunks),
        numChunks: transcriptData.transcript.chunks?.length || 0
      });
      
      let embeddingSuccess = false;
      
      // Now that we have permission, process all chunks first before saving to database
      if (docId && transcriptData.transcript.chunks && transcriptData.transcript.chunks.length > 0) {
        console.log("Starting Step 3: Preparing transcript chunks");
        setStatus(`Preparing ${transcriptData.transcript.chunks.length} transcript chunks...`);
        
        // Prepare all chunks first before sending to server
        const processedChunks = [];
        
        // Process each chunk
        for (let i = 0; i < transcriptData.transcript.chunks.length; i++) {
          // Check for cancellation during processing
          if (isCancelled) {
            console.log("Process cancelled by user during chunk processing");
            setOpen(false);
            setYoutubeUrl("");
            setTitle("");
            setDescription("");
            setStatus("");
            alert("YouTube video link saved successfully! Embedding process was cancelled.");
            setLoading(false);
            return;
          }
          
          const chunk = transcriptData.transcript.chunks[i];
          setStatus(`Processing chunk ${i + 1}/${transcriptData.transcript.chunks.length}...`);
          
          // Process this chunk
          const processedChunk = {
            id: chunk.id,
            text: chunk.text,
            // Map embedding_text to embeddingText (expected by mutation)
            embeddingText: chunk.embedding_text || chunk.text,
            timestamp: {
              start: chunk.timestamp.start,
              end: chunk.timestamp.end,
              duration: chunk.timestamp.duration,
              formatted: chunk.timestamp.formatted,
            },
            analytics: {
              word_count: chunk.analytics.word_count,
              speaking_rate: chunk.analytics.speaking_rate,
            },
            createdAt: Date.now(),
            // Optional embedding field (likely not present in the input)
            ...(chunk.embedding ? { embedding: chunk.embedding } : {})
          };
          
          processedChunks.push(processedChunk);
          
          // Log progress periodically
          if (i === 0 || i === transcriptData.transcript.chunks.length - 1 || i % 10 === 0) {
            console.log(`Processed chunk ${i + 1}/${transcriptData.transcript.chunks.length}`);
          }
        }
        
        // Final cancellation check before submitting to server
        if (isCancelled) {
          console.log("Process cancelled by user after chunk processing");
          setOpen(false);
          setYoutubeUrl("");
          setTitle("");
          setDescription("");
          setStatus("");
          alert("YouTube video link saved successfully! Embedding process was cancelled.");
          setLoading(false);
          return;
        }
        
        // All chunks processed, now confirm with user before sending to server
        const confirmSave = confirm(
          `Ready to save ${processedChunks.length} chunks to database. IMPORTANT: This process cannot be cancelled once started. Proceed?`
        );
        
        if (!confirmSave) {
          console.log("User opted not to save processed chunks");
          setOpen(false);
          setYoutubeUrl("");
          setTitle("");
          setDescription("");
          setStatus("");
          alert("YouTube video link saved successfully! Embedding data was not saved.");
          setLoading(false);
          return;
        }
        
        // Disable cancellation once user confirms saving to database
        setStatus(`Saving data to database. Please wait. This cannot be cancelled.`);
        
        // Set a flag in the dialog state to indicate we're in the non-cancellable phase
        const nonCancellablePhase = true;
        
        // Now send all processed chunks to server at once
        try {
          console.log("Sending all processed chunks to server");
          
          const mutationParams = {
            fileId: docId,
            chunks: processedChunks
          };
          
          console.log("Mutation params ready:", JSON.stringify(mutationParams).slice(0, 200) + "...");
          console.log("Calling mutation now...");
          setStatus("Generating embeddings and saving to database. Please wait...");
          const embeddingResult = await addYoutubeTranscriptEmbeddings(mutationParams);
          console.log("Embedding mutation succeeded:", embeddingResult);
          embeddingSuccess = true;
        } catch (e) {
          console.error("Embedding mutation failed:", e);
          console.error("Error details:", {
            name: e.name,
            message: e.message,
            stack: e.stack
          });
          
          // Provide a more helpful error message for API key issues
          if (e.message && e.message.includes("API key")) {
            // Don't stop the process, just inform user about partial success
            alert("Video saved but embeddings failed: API key issue. Search may be limited.");
          } else {
            // For other errors, also allow partial success
            alert("Video saved but embeddings failed: " + (e.message || "Unknown error"));
          }
        }
      }

      setOpen(false);
      setYoutubeUrl("");
      setTitle("");
      setDescription("");
      setStatus("");
      
      // Show appropriate success message based on what was saved
      if (embeddingSuccess) {
        alert("Success! Video and transcript data saved.");
      } else if (validChunks && validChunks.length > 0) {
        alert("Video saved but embeddings incomplete. Search may be limited.");
      } else {
        alert("Video saved successfully!");
      }
    } catch (error) {
      // Check if this is a cancellation
      if (isCancelled) {
        console.log("Process was cancelled by user");
        // If we were in the middle of saving video metadata, we don't show any message
        // as the cancellation handlers will have shown appropriate messages
      } else {
        console.error("Upload process failed:", error);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // More user-friendly error messages
        if (error.message && error.message.includes("API key")) {
          alert("There was a problem with API authentication. The video might be saved, but search functionality may be limited.");
        } else if (error.message && error.message.includes("network")) {
          alert("Network error occurred. Please check your internet connection and try again.");
        } else {
          alert("We encountered a problem while processing your request. Please try again later.");
        }
      }
    } finally {
      // Reset states
      setLoading(false);
      setStatus("");
      setIsCancelled(false);
    }
  };

  return (
    <div>
      <Dialog 
        open={open} 
        onOpenChange={(newOpen) => {
          // If status indicates we're in the non-cancellable phase, prevent dialog from closing
          if (!newOpen && status.includes("cannot be cancelled")) {
            return; // Don't allow closing
          }
          
          // If dialog is closing and we're still loading, trigger cancellation
          if (!newOpen && loading) {
            setIsCancelled(true);
            setStatus("Cancelling process...");
            // Don't close the dialog yet - let the cancellation logic handle it
            return;
          }
          // Otherwise, normal behavior
          setOpen(newOpen);
        }}
      >
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload YouTube URL</DialogTitle>
            <DialogDescription asChild>
              <div>
                <div className="mt-3">
                  <label htmlFor="youtube-url" className="block mb-2 font-medium">YouTube URL*</label>
                  <Input
                    id="youtube-url"
                    placeholder="Enter YouTube video URL"
                    className="border border-gray-300 rounded-md p-2 w-full"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="mt-3">
                  <label htmlFor="youtube-title" className="block mb-2 font-medium">Title (optional)</label>
                  <Input
                    id="youtube-title"
                    placeholder="Enter video title"
                    className="border border-gray-300 rounded-md p-2 w-full"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="mt-3">
                  <label htmlFor="youtube-description" className="block mb-2 font-medium">Description (optional)</label>
                  <Input
                    id="youtube-description"
                    placeholder="Enter video description"
                    className="border border-gray-300 rounded-md p-2 w-full"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {loading && (
                  <div className="mt-4 p-2 border border-blue-300 bg-blue-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-t-blue-600 border-r-blue-600 border-b-blue-300 border-l-blue-300 rounded-full animate-spin"></div>
                      <p className="text-sm text-blue-800">{status || "Processing..."}</p>
                    </div>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {/* Hide cancel button when in final DB save process */}
            {!(loading && status.includes("cannot be cancelled")) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  // Don't allow cancellation if we're in the non-cancellable phase
                  if (status.includes("cannot be cancelled")) {
                    return;
                  }
                  setIsCancelled(true);
                  setStatus("Cancelling process...");
                  // If we're not in the middle of an API call, close the dialog immediately
                  if (!loading) {
                    setOpen(false);
                  }
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !youtubeUrl}
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadYoutubeDialoguebox;
