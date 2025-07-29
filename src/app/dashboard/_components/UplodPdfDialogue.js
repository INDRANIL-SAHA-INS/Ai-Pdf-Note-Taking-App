"use client";
import React, { useState } from 'react'
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button";
import { Loader2Icon } from 'lucide-react';
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { v4 as uuidv4 } from 'uuid';
import { useUser } from "@clerk/nextjs";
import axios from 'axios';
import { useRouter } from 'next/navigation';

const UplodPdfDialog = ({children}) => {
  const { user } = useUser();
  const router = useRouter();
  
  const generateUploadUrl = useMutation(api.PdfStorage.generateUploadUrl);
  const savePdfFile = useMutation(api.PdfStorage.savePdfFile);
  const getFileUrl = useMutation(api.PdfStorage.getFileUrl);
  const embedding_documents = useAction(api.action.ingest);
  
  const convexUser = useQuery(api.user.getUserByEmail, 
    user?.primaryEmailAddress?.emailAddress ? 
    { email: user.primaryEmailAddress.emailAddress } : 
    "skip"
  );

  const [Loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [open, setOpen] = useState(false); // ✅ Added state for dialog control

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name.replace('.pdf', ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !fileName) {
      alert("Please select a file and enter a filename.");
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Generate upload URL
      const uploadUrl = await generateUploadUrl();
      if (!uploadUrl) {
        throw new Error("Failed to generate upload URL.");
      }

      // Step 2: Upload file to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: selectedFile,
      });

      if (!response.ok) {
        throw new Error("File upload failed.");
      }

      const { storageId } = await response.json();
      console.log("File uploaded successfully with Storage ID:", storageId);

      // Step 3: Save file metadata to database
      if (!convexUser) {
        throw new Error("User not found in database. Please make sure you're signed up.");
      }
   
      const convexUserId = convexUser._id;
      const usernamePlaceholder = user.username;
      const fileid = uuidv4();
     
      const fileurl = await getFileUrl({
        storageId: storageId,
      });

      const pdfFileId = await savePdfFile({
        fileId: fileid,
        storageId: storageId,
        createdBy: convexUserId,
        fileName: fileName ?? "Untitled",
        fileUrl: fileurl,
        username: usernamePlaceholder,
        createdAt: Date.now(),
      });

      // Step 4: Process and embed the document
      console.log('Processing PDF for embeddings...');
      const url = `/api/pdf-loader?pdfurl=${encodeURIComponent(fileurl)}`;
      const pdfResponse = await axios.get(url);
      
      // Call embedding action
      const result = await embedding_documents({
        splittext: pdfResponse.data.texts,
        fileId: fileid
      });
      
      console.log('Embedding Documents Result:', result);
      
      // ✅ Close dialog automatically on success
      setOpen(false);
      
      // ✅ Reset form state
      setSelectedFile(null);
      setFileName('');
      
      // ✅ Redirect to workspace or dashboard
      router.push('/dashboard'); // Change this to your desired route
      
      alert("File uploaded and embeddings created successfully!");

    } catch (error) {
      console.error("Upload error:", error);
      alert(error.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}> {/* ✅ Added open state control */}
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a file to upload</DialogTitle>
            <DialogDescription asChild>
              <div>
                <div className='rounded-md p-3 border-2 border-dashed border-gray-300 mt-5'>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={Loading} // ✅ Disable file input during loading
                  />
                  <label 
                    htmlFor="file-upload" 
                    className={`cursor-pointer p-2 border border-black rounded-md hover:bg-gray-200 inline-block ${Loading ? 'opacity-50 cursor-not-allowed' : ''}`} // ✅ Visual feedback when disabled
                  >
                    Choose a file
                  </label>
                  
                  {selectedFile && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-700">
                        ✓ Selected: <span className="font-medium">{selectedFile.name}</span>
                      </p>
                      <p className="text-xs text-green-600">
                        Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                  
                  {!selectedFile && (
                    <p className="text-sm text-gray-500 mt-2">No file selected</p>
                  )}
                </div>
                <div className='mt-3'>
                  <label className=''>Filename*</label>
                  <Input 
                    placeholder="Enter filename" 
                    className="border border-gray-300 rounded-md p-2 w-full mt-2" 
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    disabled={Loading} // ✅ Disable input during loading
                  />
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={Loading}> {/* ✅ Disable cancel during loading */}
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={Loading || !selectedFile || !fileName} // ✅ Disable upload button when loading or form incomplete
            >
              {Loading ? <Loader2Icon className='animate-spin'/> : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UplodPdfDialog
