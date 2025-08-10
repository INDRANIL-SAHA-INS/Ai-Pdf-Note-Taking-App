"use client";
import React from 'react';
import Navbar from './Navbar';

const CourseLayout = ({ children, title, activeLessonId, onBackClick }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar title={title} activeLessonId={activeLessonId} onBackClick={onBackClick} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default CourseLayout;
