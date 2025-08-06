"use client";
import React, { useEffect, useState } from 'react';
import WorkspaceHeader from '../../_components/workspaceheader';
import Tiptap from '../../_components/tiptap';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import YoutubeViewer from '../components/youtubeviewer';




const Getnotesfromyoutube = () => {
  const [youtubevideo_id, setyoutubevideo_id] = useState("");
  const { youtubeurlid } = useParams(); // this is the _id
  // Fetch the video record from Convex
  const youtubeVideoData = useQuery(api.youtube.getYoutubeVideoById, youtubeurlid ? { _id: youtubeurlid } : "skip");
  console.log("YouTube Video Data:", youtubeVideoData);

  // Function to extract YouTube video ID from different URL formats
  const extractYoutubeVideoId = (url) => {
    if (!url) return null;
    try {
      // 1. Standard youtube.com/watch?v=VIDEO_ID format
      const standardMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/watch\?.*&v=)([^&\?#]+)/);
      if (standardMatch && standardMatch[1]) {
        return standardMatch[1];
      }
      // 2. Handle youtu.be/VIDEO_ID format (YouTube shortener)
      const shortMatch = url.match(/youtu\.be\/([^&\?#]+)/);
      if (shortMatch && shortMatch[1]) {
        return shortMatch[1];
      }
      // 3. Handle m.youtube.com (mobile) URLs
      const mobileMatch = url.match(/m\.youtube\.com\/watch\?v=([^&\?#]+)/);
      if (mobileMatch && mobileMatch[1]) {
        return mobileMatch[1];
      }
      // 4. Handle YouTube shorts
      const shortsMatch = url.match(/youtube\.com\/shorts\/([^&\?#]+)/);
      if (shortsMatch && shortsMatch[1]) {
        return shortsMatch[1];
      }
      // 5. As a fallback, try to parse URL and get the v parameter
      try {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get("v");
        if (videoId) return videoId;
      } catch (e) {
        console.error("Error parsing URL:", e);
      }
      return null;
    } catch (error) {
      console.error("Error extracting YouTube video ID:", error);
      return null;
    }
  };

  // Extract videoId and title from youtubeVideoData
  useEffect(() => {
    if (youtubeVideoData && youtubeVideoData.url) {
      const videoId = extractYoutubeVideoId(youtubeVideoData.url);
      if (videoId) {
        setyoutubevideo_id(videoId);
      }
    }
  }, [youtubeVideoData]);

  // Get the title from youtubeVideoData
  const videoTitle = youtubeVideoData?.title || "YouTube Video";

  return (
    <div className="">
      <WorkspaceHeader title={videoTitle} />
      <div className='grid grid-cols-2 gap-4 mt-1'>
        <div className='h-[90vh]'>
          <Tiptap />
        </div>
        <div className='h-[90vh] mt-1 overflow-hidden'>
          <YoutubeViewer videoId={youtubevideo_id} />
        </div>
      </div>
    </div>
  );
};

export default Getnotesfromyoutube;
