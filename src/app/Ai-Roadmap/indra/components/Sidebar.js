"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const Sidebar = ({ modules = [], activeModuleId, activeLessonId, onModuleSelect, onLessonSelect, progress = 0, activeView = 'outline', onViewChange }) => {
  // Keep track of which module is expanded (only one at a time)
  const [expandedModuleId, setExpandedModuleId] = useState(null);

  // Toggle function for module expansion
  const toggleModule = (moduleId, event) => {
    event.stopPropagation();
    
    // If clicking on the currently expanded module, close it
    // Otherwise, open the clicked module and close any other
    if (expandedModuleId === moduleId) {
      setExpandedModuleId(null);
    } else {
      setExpandedModuleId(moduleId);
    }
  };

  // Function to handle module selection
  const handleModuleClick = (moduleId) => {
    onModuleSelect(moduleId);
  };

  return (
    <div className="bg-white border-r border-black h-full overflow-y-auto w-72 flex flex-col">
      {/* Progress section at the top */}
      <div className="border-b border-black py-3 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-700">{progress}% Completed</div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => onViewChange('outline')}
              className={`text-xs px-3 py-1 rounded-full transition ${
                activeView === 'outline'
                  ? 'bg-yellow-400 text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Outline
            </button>
            <button
              onClick={() => onViewChange('map')}
              className={`text-xs px-3 py-1 rounded-full transition ${
                activeView === 'map'
                  ? 'bg-yellow-400 text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Map
            </button>
          </div>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Course Modules</h2>
        <div className="space-y-3">
          {modules.map((module, index) => {
            const isActive = activeModuleId === module.id;
            const isExpanded = expandedModuleId === module.id;
            
            return (
              <div key={module.id} className="rounded-md overflow-hidden border border-black">
                <div
                  className={`flex items-center justify-between p-3 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleModuleClick(module.id)}
                >
                  <div className="flex items-center">
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mr-3 ${
                      isActive 
                        ? 'bg-blue-200 text-blue-700' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-inherit">{module.title}</span>
                  </div>
                  
                  <button 
                    onClick={(e) => toggleModule(module.id, e)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-300 rounded transition-colors p-1"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Lessons dropdown */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-black">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isLessonActive = activeLessonId === lesson.id;
                      
                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center p-2 pl-10 cursor-pointer transition-colors ${
                            isLessonActive
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => onLessonSelect(lesson.id)}
                        >
                          <div className={`w-5 h-5 flex items-center justify-center rounded-full text-xs mr-3 ${
                            isLessonActive 
                              ? 'bg-blue-200 text-blue-700' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {lessonIndex + 1}
                          </div>
                          <span className="text-sm">{lesson.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
