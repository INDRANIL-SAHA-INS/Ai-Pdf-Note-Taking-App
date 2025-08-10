"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import WorkspaceHeader from '../_components/workspaceheader';
import Pdfviewer from '../_components/pdfviewer';
import { useQuery } from 'convex/react';
import { api } from "../../../../convex/_generated/api";
import Tiptap from '../_components/tiptap';

const Workspace = () => {
  const {fileId} = useParams()
  // Fetch file information using the fileId
  const getfileinfo = useQuery(api.PdfStorage.getfilerecord, { fileId });
  
  useEffect(() => {
    // Only log when query has completed (not undefined)
    if (getfileinfo !== undefined) {
      if (getfileinfo === null) {
        console.error("File information not found for fileId:", fileId);
      } else {
        console.log("File information:", getfileinfo);
      }
    }
  }, [getfileinfo, fileId]);

  // Show loading state while query is pending
  if (getfileinfo === undefined) {
    return (
      <div>
        <WorkspaceHeader />    
        <div>Loading workspace...</div>
      </div>
    );
  }

  // Show error state if file not found
  if (getfileinfo === null) {
    return (
      <div>
        <WorkspaceHeader />    
        <div>File not found</div>
      </div>
    );
  }

  return (
    <div className="">
      <WorkspaceHeader FilName={getfileinfo.fileName} fileId={fileId} />
      <div className='grid grid-cols-2 gap-4 mt-1'>
        <div className='h-[90vh]'>
          <Tiptap />

        </div>
        <div  className='h-[90vh] mt-1'>
          <Pdfviewer fileUrl={getfileinfo.fileUrl} />

        </div>
        </div> 
      
    </div>
  )
}

export default Workspace 