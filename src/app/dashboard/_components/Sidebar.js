"use client"
import React from 'react'
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Layout, Shield } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import UplodPdfDialog from './UplodPdfDialogue';
import axios from 'axios';
import UploadYoutubeDialoguebox from './uploadYoutbeDialoguebox';


const Sidebar = () => {
 
  

  return (
    <div className='shadow-md h-screen p-7'>
      <Image src={"/logo.svg"} alt="Logo" width={170} height={170} />


      <div className='mt-10'>
        
        <UplodPdfDialog>
          <Button className="w-full"> + Upload Document</Button>
        </UplodPdfDialog>
        <UploadYoutubeDialoguebox>
          <Button className="w-full mt-3" >+ Upload YouTube URL</Button>
        </UploadYoutubeDialoguebox>
        <div className='flex gap-2 items-center p-5 mt-5  hover:bg-slate-100 rounded-lg cursor-pointer'>
          <Layout className='' />
          <h2>Workspace</h2>
        </div>
        <div className='flex gap-2 items-center p-5 mt-1  hover:bg-slate-100 rounded-lg cursor-pointer'>
          <Shield className='' />
          <h2>Upgrade</h2>
        </div>
     
      </div>


      <div className='absolute bottom-20 p-2 w-[80%]'>
        <Progress value={33} />
        <p className='text-sm mt-1'>2 Out Of 5 Pdf Uploaded</p>
        <p className='text-sm mt-2 text-gray-400'>Upgrade to add more Pdfs</p>
      </div>
    </div>
  )
} 

export default Sidebar
