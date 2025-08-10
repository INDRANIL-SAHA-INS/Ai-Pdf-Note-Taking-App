"use client";
import React from 'react';

const ProgressBar = ({ progress = 0, activeView = 'outline', onViewChange }) => {
  return (
    <div className="bg-white border-b border-gray-200 py-3 px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-700">{progress}% Completed</div>
        <div className="flex items-center space-x-2 bg-gray-400 rounded-full p-1">
          <button
            onClick={() => onViewChange('outline')}
            className={`text-sm px-4 py-1 rounded-full transition ${
              activeView === 'outline'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Outline
          </button>
          <button
            onClick={() => onViewChange('map')}
            className={`text-sm px-4 py-1 rounded-full transition ${
              activeView === 'map'
                ? 'bg-white text-gray-900 shadow-sm'
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
  );
};

export default ProgressBar;
