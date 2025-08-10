"use client"
import React from 'react'
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Layout, Shield, Youtube } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import UplodPdfDialog from './UplodPdfDialogue';
import axios from 'axios';
import UploadYoutubeDialoguebox from './uploadYoutbeDialoguebox';
import { usePathname } from 'next/navigation';


const Sidebar = () => {
 const path=usePathname()

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
        <Link href="/dashboard">
          <div className={`flex gap-2 items-center p-4 mt-5 rounded-lg cursor-pointer border-2 transition-all ${path === '/dashboard' ? 'bg-gray-200 border-black text-black' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
            <Layout className='' />
            <h2 className="font-medium">Workspace</h2>
          </div>
        </Link>
        <Link href="/dashboard/upgrade">
          <div className={`flex gap-2 items-center p-4 mt-3 rounded-lg cursor-pointer border-2 transition-all ${path === '/dashboard/upgrade' ? 'bg-gray-200 border-black text-black' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
            <Shield className='' />
            <h2 className="font-medium">Upgrade</h2>
          </div>
        </Link>
        <Link href="/dashboard/ai-video-finder">
          <div className={`flex gap-2 items-center p-4 mt-3 rounded-lg cursor-pointer border-2 transition-all ${path === '/dashboard/ai-video-finder' ? 'bg-gray-200 border-black text-black' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
            <Youtube className='' />
            <h2 className="font-medium">AI Video Finder</h2>
          </div>
        </Link>
        <Link href="/Ai-Roadmap/help">
          <div className={`flex gap-2 items-center p-4 mt-3 rounded-lg cursor-pointer border-2 transition-all ${path === '/Ai-Roadmap/help' ? 'bg-gray-200 border-black text-black' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
            <Youtube className='' />
            <h2 className="font-medium">AI Tutor</h2>
          </div>
        </Link>
     
      </div>


      <div className='absolute bottom-6 p-2 w-[80%]'>
        <Progress value={33} />
        <p className='text-sm mt-1'>2 Out Of 5 Pdf Uploaded</p>
        <p className='text-sm mt-2 text-gray-400'>Upgrade to add more Pdfs</p>
      </div>
    </div>
  )
} 

export default Sidebar
