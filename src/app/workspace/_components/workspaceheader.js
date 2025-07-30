import { UserButton } from '@clerk/nextjs'
import React from 'react'
import Image from 'next/image'

const WorkspaceHeader = () => {
  return (
    <div className='p-4 flex justify-between shadow-md '>
      <Image src={"/logo.svg"} alt="Logo" width={170} height={170} />
      <UserButton />
    </div>
  )
}

export default WorkspaceHeader
