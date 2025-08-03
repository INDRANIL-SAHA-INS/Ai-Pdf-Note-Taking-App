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
    setLoading(true);
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
      const apiResponse = await axios.get(`http://127.0.0.1:5000/transcript?video_id=${videoId}`);
      if (!apiResponse.data.success) {
        alert(apiResponse.data.error || "Failed to get transcript for this video.");
        setLoading(false);
        return;
      }
      const transcriptData = apiResponse.data.data;
      
      // Validate transcript data structure
      if (!transcriptData || !transcriptData.transcript || !transcriptData.transcript.chunks) {
        alert("No transcript chunks available, can't process.");
        setLoading(false);
        return;
      }
      
      // Validate chunk structure
      const validChunks = transcriptData.transcript.chunks.filter(chunk => {
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
      
      console.log(`Transcript data fetched successfully! Valid chunks: ${validChunks.length}/${transcriptData.transcript.chunks.length}`);
      
      if (validChunks.length === 0) {
        alert("No valid transcript chunks found, can't process.");
        setLoading(false);
        return;
      }
      
      // Replace chunks with validated chunks
      transcriptData.transcript.chunks = validChunks;

      // Step 2: Upload video info to Convex

      // Step 2: Upload video info to Convex and get _id
      console.log("About to call addYoutubeVideo mutation");
      const docId = await addYoutubeVideo({
        url: youtubeUrl,
        createdBy: user.primaryEmailAddress?.emailAddress || "unknown_user",
        createdAt: Date.now(),
        title: title || undefined,
        description: description || undefined,
      });
      console.log("Video saved to Convex. Returned ID:", docId);
      console.log("ID type:", typeof docId);

      // Step 3: Save transcript chunks to Convex (if present)
      console.log("Checking conditions for Step 3:", {
        hasFileId: Boolean(docId),
        hasChunks: Boolean(transcriptData.transcript.chunks),
        numChunks: transcriptData.transcript.chunks?.length || 0
      });
      
      if (docId && transcriptData.transcript.chunks && transcriptData.transcript.chunks.length > 0) {
        console.log("Starting Step 3: Adding transcript embeddings");
        console.log("Calling addYoutubeTranscriptEmbeddings with", transcriptData.transcript.chunks.length, "chunks");
        console.log("Sample chunk:", transcriptData.transcript.chunks[0]);
        console.log("Sample chunk embedding_text:", transcriptData.transcript.chunks[0].embedding_text);
        console.log("Sample chunk embeddingText:", transcriptData.transcript.chunks[0].embeddingText);
        console.log("Using fileId:", docId, "Type:", typeof docId);
        try {
          console.log("Preparing mutation parameters");
          const mutationParams = {
            fileId: docId, 
            chunks: transcriptData.transcript.chunks.map(chunk => {
              // Create a new object with only the fields expected by the mutation
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
              
              // Log the first chunk to verify structure
              if (chunk.id === 0) {
                console.log("First chunk after processing:", processedChunk);
              }
              return processedChunk;
            }),
          };
          console.log("Mutation params ready:", JSON.stringify(mutationParams).slice(0, 200) + "...");
          console.log("Calling mutation now...");
          const embeddingResult = await addYoutubeTranscriptEmbeddings(mutationParams);
          console.log("Embedding mutation succeeded:", embeddingResult);
        } catch (e) {
          console.error("Mutation failed:", e);
          console.error("Error details:", {
            name: e.name,
            message: e.message,
            stack: e.stack
          });
          
          // Provide a more helpful error message for API key issues
          if (e.message && e.message.includes("API key")) {
            alert("Failed to save transcript embeddings: API key not accessible to Convex. Please check that you've added the 'use node' directive to the youtubeEmbeddings.js file and restarted the Convex server.");
            setLoading(false);
            return;
          }
          
          // Re-throw to prevent false success message
          throw new Error("Failed to save transcript embeddings: " + (e.message || "Unknown error"));
        }
      }

      setOpen(false);
      setYoutubeUrl("");
      setTitle("");
      setDescription("");
      alert("YouTube URL and transcript uploaded successfully!");
    } catch (error) {
      console.error("Upload process failed:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      alert(error.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
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
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
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
