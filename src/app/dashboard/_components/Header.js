import { UserButton } from '@clerk/nextjs'
import React from 'react'

const Header = () => {
  return (
    <div className='text-blue-500 flex justify-end p-5 shadow-md'>
      <UserButton />
    </div>
  )
}

export default Header
