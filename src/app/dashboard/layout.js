import React from 'react'
import Header from './_components/Header'
import Sidebar from './_components/Sidebar'

const DashboardLayout = ({ children }) => {
  return (
    <div className="hero-container flex flex-row h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hero1-container bg-gray-100 h-full hidden md:block md:w-64 fixed top-0 left-0 z-40">
        <Sidebar />
      </div>
      {/* Main content */}
      <div className="hero2-container flex-1 md:ml-64 flex flex-col h-full">
        <div className="flex-shrink-0">
          <Header />
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
