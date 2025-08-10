"use client";
import React from 'react';

const QuizPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Quiz Builder</h1>
        <p className="text-base text-gray-600 mb-8">
          Generate quizzes on any topic to test your knowledge.
        </p>
        
        {/* Placeholder content - implement your quiz UI here */}
        <div className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-center text-gray-700">Quiz content will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
