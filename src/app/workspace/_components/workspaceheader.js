import { UserButton } from '@clerk/nextjs'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'


const WorkspaceHeader = ({ title, FilName , fileId }) => {
  const displayText = title || FilName || "";
  return (
    <div className='p-4 flex justify-between shadow-md '>
      <Image src={"/logo.svg"} alt="Logo" width={170} height={170} />
      <h3 className='text-lg font-semibold'>{displayText}</h3>
      <div className='bg-gray-100 p-2 rounded flex justify-between items-center gap-4'>
        <Link href={`/workspace/test/${fileId}`}><div className='text-white bg-red-600 p-2 rounded'>Take Test</div></Link>
        <UserButton />
      </div>
    </div>
  );
}

export default WorkspaceHeader
