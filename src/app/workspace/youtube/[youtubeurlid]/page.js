"use client";
import React, { useEffect } from 'react';
import WorkspaceHeader from '../../_components/workspaceheader';
import Tiptap from '../../_components/tiptap';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';



const Getnotesfromyoutube = () => {
  const { youtubeurlid } = useParams(); // this is the _id
  // Fetch the video record from Convex
  const video = useQuery(api.youtube.getYoutubeVideoById, youtubeurlid ? { _id: youtubeurlid } : "skip");

  useEffect(() => {
    if (video && video.url) {
      console.log("YouTube URL:", video.url);
    }
  }, [video]);

  return (
    <div className="">
      <WorkspaceHeader/>
      <div className='grid grid-cols-2 gap-4 mt-1'>
        <div className='h-[90vh]'>
          <Tiptap />
        </div>
        <div className='bg-amber-200 h-[90vh] mt-1'>
          {/* section for displaying youtube video */}
        </div>
      </div>
    </div>
  );
};

export default Getnotesfromyoutube;
