"use client";
import { useUser } from '@clerk/nextjs';
import { api } from 'convex/_generated/api';
import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from 'convex/react';
import Image from 'next/image';
import Link from 'next/link';

const Page = () => {
  const { user } = useUser();
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setUserEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  const getuserfiles = useQuery(
    api.PdfStorage.getPdfFilesByUser_email,
    userEmail ? { useremail: userEmail } : "skip"
  );
  const getuseryoutubefiles = useQuery(
    api.youtube.getYoutubeVideosByEmail,
    userEmail ? { createdBy: userEmail } : "skip"
  );
  console.log("User files:", getuserfiles);
  console.log("User YouTube files:", getuseryoutubefiles);

  return (
   <div className='workspace-container'>
     <div>
      <h1 className="text-3xl font-medium">Workspace</h1>
    </div>
    <div className="flex flex-wrap gap-4 min-h-[120px]">
      {getuserfiles === undefined && getuseryoutubefiles === undefined ? (
        // Loading state: show 7 skeleton cards
        Array.from({ length: 7 }).map((_, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-4 w-44 bg-gray-300 shadow flex flex-col items-center animate-pulse"
          >
            <div className="w-16 h-16 bg-gray-200 rounded mb-3" />
            <div className="w-4/5 h-4 bg-gray-200 rounded mb-2" />
            <div className="w-3/5 h-3 bg-gray-200 rounded" />
          </div>
        ))
      ) : (getuserfiles?.length > 0 || getuseryoutubefiles?.length > 0) ? (
        <>
          {getuserfiles?.map((file) => (
            <Link href={`/workspace/${file.fileId}`} key={file._id} className="no-underline">
              <div className="border rounded-lg p-4 w-44 h-56 bg-white shadow flex flex-col items-center">
                <Image
                  src="/pdf.png"
                  alt="PDF icon"
                  width={64}
                  height={64}
                  className="mb-3"
                />
                <div
                  className="font-bold mb-2 text-center w-full overflow-hidden relative"
                  style={{ height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <AnimatedFileName fileName={file.fileName} />
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {new Date(file._creationTime).toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
          {getuseryoutubefiles?.map((video) => {
            // Extract video ID from YouTube URL
            let videoId = "";
            const match = video.url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
            if (match) {
              videoId = match[1];
            }
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "/pdf.png";
            return (
              <Link href={`/workspace/youtube/${video._id}`} key={video._id} className="no-underline">
                <div className="border rounded-lg p-4 w-44 h-56 bg-white shadow flex flex-col items-center">
                  <Image
                    src={thumbnailUrl}
                    alt="YouTube Thumbnail"
                    width={64}
                    height={64}
                    className="mb-3 object-cover"
                  />
                  <div
                    className="font-bold mb-2 text-center w-full overflow-hidden relative"
                    style={{ height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <AnimatedFileName fileName={video.title || video.url} />
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {new Date(video._creationTime).toLocaleString()}
                  </div>
                </div>
              </Link>
            );
          })}
        </>
      ) : (
        <div className="w-full text-center mt-10">
          <div className="inline-block px-8 py-6 bg-gray-100 rounded-xl text-gray-500 font-medium text-lg shadow">
            No files found
          </div>
        </div>
      )}
    </div>
   </div>
  );
};


const AnimatedFileName = ({ fileName }) => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (textRef.current && containerRef.current) {
      setShouldAnimate(textRef.current.scrollWidth > containerRef.current.offsetWidth);
    }
  }, [fileName]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', overflow: 'hidden', position: 'relative', height: '28px' }}
    >
      <span
        ref={textRef}
        style={
          shouldAnimate
            ? {
                display: 'inline-block',
                whiteSpace: 'nowrap',
                animation: 'scroll-filename 6s linear infinite',
                minWidth: '100%',
              }
            : {
                display: 'inline-block',
                whiteSpace: 'nowrap',
                minWidth: '100%',
              }
        }
      >
        {fileName}
      </span>
      <style jsx>{`
        @keyframes scroll-filename {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default Page;
