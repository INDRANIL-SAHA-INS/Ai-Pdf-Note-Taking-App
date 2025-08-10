"use client";
import React from 'react';
import { ArrowRight, Eye } from 'lucide-react';

const ModuleContent = ({ modules = [], activeModuleId, onLessonSelect }) => {
  // Find the active module
  const activeModule = modules.find(module => module.id === activeModuleId);
  
  if (!activeModule) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <p className="text-gray-500">Select a module to view its lessons</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{activeModule.title}</h2>
      
      <div className="space-y-4">
        {activeModule.lessons.map((lesson, index) => (
          <div
            key={lesson.id}
            className="flex items-center justify-between p-3 border border-black rounded-md hover:bg-gray-200 hover:border-gray-500 transition cursor-pointer"
            onClick={() => onLessonSelect(lesson.id)}
          >
            <div className="flex items-center">
              <div className="w-7 h-7 flex items-center justify-center bg-gray-300 text-gray-700 rounded-full text-sm mr-4">
                {index + 1}
              </div>
              <span className="text-gray-800">{lesson.title}</span>
            </div>
            <div className="text-black hover:text-blue-800 text-sm font-medium flex items-center p-2 rounded-md hover:bg-gray-200 transition-colors">
              <Eye className="h-5 w-5 mr-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleContent;
