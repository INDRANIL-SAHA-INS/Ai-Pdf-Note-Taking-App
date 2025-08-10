"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

// Import our custom components
import CourseLayout from '../components/CourseLayout';
import Sidebar from '../components/Sidebar';
import ModuleContent from '../components/ModuleContent';
import LessonContent from '../components/LessonContent';

const CourseDetailPage = () => {
  const params = useParams();
  const courseId = params.courseId; // This will be a string from the URL
  
  // State management
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [viewMode, setViewMode] = useState('outline'); // 'outline' or 'map'
  const [progress, setProgress] = useState(0); // Progress percentage
  
  // Get user from Clerk
  const { user, isLoaded } = useUser();
  
  // Fetch course data by ID from URL path parameter
  const courseData = useQuery(
    api.coursesData.getCourseById,
    courseId ? { courseId } : null
  );
  
  // Set first module as active when data loads
  useEffect(() => {
    if (courseData?.modules?.length > 0) {
      setActiveModuleId(courseData.modules[0].id);
    }
  }, [courseData]);

  // Find the active module and lesson
  const activeModule = courseData?.modules?.find(module => module.id === activeModuleId);
  const activeLesson = activeModule?.lessons?.find(lesson => lesson.id === activeLessonId);
  
  // Handle module selection
  const handleModuleSelect = (moduleId) => {
    setActiveModuleId(moduleId);
    // Reset lesson selection when changing modules
    setActiveLessonId(null);
  };
  
  // Handle lesson selection
  const handleLessonSelect = (lessonId) => {
    setActiveLessonId(lessonId);
    
    // Find which module contains this lesson and make it active
    if (courseData?.modules) {
      for (const module of courseData.modules) {
        const lessonExists = module.lessons.some(lesson => lesson.id === lessonId);
        if (lessonExists) {
          setActiveModuleId(module.id);
          break;
        }
      }
    }
  };
  
  // Handle view mode change
  const handleViewChange = (mode) => {
    setViewMode(mode);
  };
  
  // Handle back button click
  const handleBackClick = () => {
    if (activeLessonId) {
      // If viewing a lesson, go back to module view
      setActiveLessonId(null);
    } else {
      // If viewing module list, go back to AI Tutor
      window.location.href = "/Ai-Roadmap/help";
    }
  };
  
  // Show loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Authentication check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Sign In Required</h1>
          <p className="text-base text-gray-600 mb-8">
            Please sign in to access your learning dashboard.
          </p>
        </div>
      </div>
    );
  }
  
  // Course not found
  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">No Course Found</h1>
          <p className="text-base text-gray-600 mb-8">
            {!courseId ? 
              "Course ID is missing. Please check the URL." : 
              `No course found with ID: ${courseId}. It may have been deleted or is invalid.`}
          </p>
        </div>
      </div>
    );
  }
  
  // Render the content based on the view mode
  const renderContent = () => {
    if (viewMode === 'map') {
      return (
        <div className="flex-1 p-6 flex justify-center items-center">
          <div className="text-center p-8 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-medium mb-2">Course Map Coming Soon</h3>
            <p className="text-gray-600">
              A visual representation of your learning path will be available here.
            </p>
          </div>
        </div>
      );
    }
    
    if (activeLessonId) {
      return (
        <div className="flex-1 overflow-auto">
          <LessonContent lesson={activeLesson} module={activeModule} />
        </div>
      );
    }
    
    return (
      <div className="flex-1 overflow-auto">
        <ModuleContent 
          modules={courseData.modules} 
          activeModuleId={activeModuleId} 
          onLessonSelect={handleLessonSelect} 
        />
      </div>
    );
  };
  
  return (
    <CourseLayout 
      title={courseData.courseTitle}
      activeLessonId={activeLessonId}
      onBackClick={handleBackClick}
    >
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar - visible on desktop, toggleable on mobile */}
        <div className="hidden md:block w-72 shrink-0 h-[calc(100vh-64px)] overflow-hidden">
          <Sidebar 
            modules={courseData.modules} 
            activeModuleId={activeModuleId}
            activeLessonId={activeLessonId}
            onModuleSelect={handleModuleSelect}
            onLessonSelect={handleLessonSelect}
            progress={progress}
            activeView={viewMode}
            onViewChange={handleViewChange}
          />
        </div>
        
        {/* Mobile Module Selector */}
        <div className="md:hidden p-2 bg-white border-b border-gray-200 overflow-x-auto">
          <div className="flex space-x-2 p-1">
            {courseData.modules.map((module, index) => (
              <button
                key={module.id}
                onClick={() => handleModuleSelect(module.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm transition ${
                  activeModuleId === module.id
                    ? 'bg-gray-100 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {index + 1}. {module.title}
              </button>
            ))}
          </div>
        </div>
        
        {/* Main content area */}
        {renderContent()}
      </div>
    </CourseLayout>
  );
};

export default CourseDetailPage;
