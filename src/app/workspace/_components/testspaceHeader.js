import { UserButton } from '@clerk/nextjs'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'


const TestSpaceHeader = ({ title, FileName, fileId, onStartTest }) => {
  const displayText = title || FileName || "";

  const handleStartTest = () => {
    if (onStartTest) {
      onStartTest();
    }
  };

  return (
    <div className='p-4 flex justify-between shadow-md '>
      <Image src={"/logo.svg"} alt="Logo" width={170} height={170} />
      <h3 className='text-lg font-semibold'><span className='text-white bg-red-600 p-1 rounded m-1 font-normal'>Test on </span> : {displayText}</h3>
      <div className='test-buttons bg-gray-100 px-3 py-1 rounded-lg flex items-center gap-2'>
        <Button 
          className="text-sm px-3 py-1 h-8" 
          onClick={handleStartTest}
        >
          Start Test
        </Button>
        <Link href="/dashboard">
          <div className='text-white bg-red-600 px-2 py-1 rounded text-sm hover:bg-red-700 transition-colors cursor-pointer'>
            End Test
          </div>
        </Link>
        <div className="scale-75">
          <UserButton />
        </div>
      </div>
    </div>
  );
}

export default TestSpaceHeader
