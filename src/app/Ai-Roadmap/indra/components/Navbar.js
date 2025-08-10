"use client";
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const Navbar = ({ title, activeLessonId, onBackClick }) => {
  const handleBackClick = (e) => {
    e.preventDefault();
    if (onBackClick) {
      onBackClick();
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-black py-3 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <a href="#" 
           onClick={handleBackClick} 
           className="flex items-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-md px-4 py-1.5 text-sm font-medium transition">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>
            {activeLessonId ? "Back to Module" : "Back to AI Tutor"}
          </span>
        </a>
      </div>

      <h1 className="text-xl md:text-2xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2 hidden md:block">
        {title || "Course Outline"}
      </h1>

      <div className="flex items-center">
        <Link href="/dashboard/upgrade">
          <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-md px-4 py-1.5 text-sm font-medium transition">
            Upgrade
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
