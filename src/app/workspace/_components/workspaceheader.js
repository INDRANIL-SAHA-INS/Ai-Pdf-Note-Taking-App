import { UserButton } from '@clerk/nextjs'
import React from 'react'
import Image from 'next/image'

const WorkspaceHeader = ({ title, FilName }) => {
  const displayText = title || FilName || "";
  return (
    <div className='p-4 flex justify-between shadow-md '>
      <Image src={"/logo.svg"} alt="Logo" width={170} height={170} />
      <h3 className='text-lg font-semibold'>{displayText}</h3>
      <UserButton />
    </div>
  );
}

export default WorkspaceHeader
