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
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { v4 as uuidv4 } from 'uuid';
import { useUser } from "@clerk/nextjs"; // Import Clerk's useUser hook

const UplodPdfDialog = ({children}) => {
  // Get the user first (this must come before useQuery)
  const { user } = useUser(); //Clerk for user management

  // Import the mutations
  const generateUploadUrl = useMutation(api.PdfStorage.generateUploadUrl);
  const savePdfFile = useMutation(api.PdfStorage.savePdfFile);
  const getFileUrl = useMutation(api.PdfStorage.getFileUrl);
  
  // Get Convex user by email (this comes after user is available)
  const convexUser = useQuery(api.user.getUserByEmail, 
    user?.primaryEmailAddress?.emailAddress ? 
    { email: user.primaryEmailAddress.emailAddress } : 
    "skip"
  );

  // State to manage loading, selected file, and filename
  const [Loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-fill filename without extension
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
      // This function creates a unique URL for uploading the PDF file
      const uploadUrl = await generateUploadUrl();
      if (!uploadUrl) {
        throw new Error("Failed to generate upload URL.");
      }

      // Step 2: Upload file to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: selectedFile, // Send the file directly, not FormData
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
   
      const convexUserId = convexUser._id; // This is the correct Convex user ID
      const usernamePlaceholder = user.username;
      console.log("Clerk user:", user);
      console.log("Convex user:", convexUser);
      console.log("Using Convex user ID:", convexUserId);
      
      const fileid = uuidv4(); // Generate a unique file ID
      // Get the file URL after saving the file
     
      const fileurl= await getFileUrl({
        storageId: storageId,
      });
      const pdfFileId = await savePdfFile({
        fileId: fileid,
        storageId: storageId,
        createdBy: convexUserId, // Use Convex user ID, not Clerk ID
        fileName: fileName ?? "Untitled",
        fileUrl: fileurl,
        username: usernamePlaceholder,
        createdAt: Date.now(),
      });

      alert("File uploaded and saved successfully!");
      console.log("PDF file saved to database with ID:", pdfFileId);

    } catch (error) {
      console.error("Upload error:", error);
      alert(error.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
      setSelectedFile(null);
      setFileName('');
    }
  };
  return (
    <div>
      <Dialog>
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
            />
            <label 
              htmlFor="file-upload" 
              className="cursor-pointer p-2 border border-black rounded-md hover:bg-gray-200 inline-block"
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
            />
          </div>
        </div>
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmit} >{Loading ? <Loader2Icon className='animate-spin'/> : "Upload"}</Button>
          </DialogFooter>


  </DialogContent>
</Dialog>
      
    </div>
  )
}

export default UplodPdfDialog
