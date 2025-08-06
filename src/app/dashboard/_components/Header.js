import { UserButton } from '@clerk/nextjs'
import React from 'react'

const Header = () => {
  return (
    <div className='text-blue-500 flex justify-end p-5 shadow-md sticky top-0 z-50 bg-white'>
      <UserButton />
    </div>
  )
}

export default Header
