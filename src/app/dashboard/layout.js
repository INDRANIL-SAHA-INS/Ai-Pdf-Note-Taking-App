import React from 'react'
import Header from './_components/Header'
import Sidebar from './_components/Sidebar'

const DashboardLayout = ({ children }) => {
  return (
    <div>
   
      <div className='md:w-64 fixed h-screen bg-gray-100'>
        <Sidebar />
      </div>
    <div className='md:ml-64 p-4'>
      <Header />
        <div>
        {children}
      </div>
    </div>
    </div>
  )
}

export default DashboardLayout
