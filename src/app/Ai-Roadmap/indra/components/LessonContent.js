"use client";
import React from 'react';
import { Book } from 'lucide-react';

const LessonContent = ({ lesson, module }) => {
  if (!lesson || !module) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">Select a lesson to view its content</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">{module.title}</p>
        <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
      </div>
      
      {/* Placeholder for lesson content */}
      <div className="bg-gray-50 rounded-lg border border-black p-8 flex flex-col items-center justify-center mt-6">
        <div className="bg-blue-100 text-blue-800 p-4 rounded-full mb-4 border border-black">
          <Book className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-medium mb-2">Lesson content will appear here</h3>
        <p className="text-gray-600 text-center">
          This is a placeholder for the lesson content that will be generated for this topic.
        </p>
        
        {/* Progress tracker */}
        <div className="mt-8 w-full max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-medium">0%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 border border-black">
            <div className="bg-blue-600 h-2.5 rounded-full w-0"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonContent;
