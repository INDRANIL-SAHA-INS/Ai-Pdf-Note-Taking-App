"use client";
import React, { useState, useEffect } from 'react';
import { Search, Book, FileText, Map, CheckSquare, FolderOpen, Layers, MoreVertical, Plus, PieChart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { useUser } from "@clerk/nextjs";
import { api } from 'convex/_generated/api';

const SavedPage = ({ selectedFormat, setSelectedFormat }) => {
  const router = useRouter();
  // State for active tab
  const [activeTab, setActiveTab] = useState('courses');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get the logged in user from Clerk
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  
  // Fetch user courses using the email address
  const userCourses = useQuery(
    api.coursesData.getAllCoursesByUser, 
    userEmail ? { createdBy: userEmail } : "skip"
  );
  
  // Log the courses when they are loaded
  useEffect(() => {
    if (userCourses) {
      console.log("User courses:", userCourses);
    }
  }, [userCourses]);
  
  // Filter courses based on search query and active tab
  const filteredCourses = userCourses 
    ? userCourses.filter(course => {
        // Match by search query
        const matchesSearch = course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Match by format (tab)
        const matchesFormat = 
          (activeTab === 'courses' && course.format === 'course') ||
          (activeTab === 'guides' && course.format === 'guide') ||
          (activeTab === 'roadmaps' && course.format === 'roadmap') ||
          (activeTab === 'quizzes' && course.format === 'quiz');
        
        return matchesSearch && matchesFormat;
      })
    : [];
    
  // Calculate total course count
  const totalCourseCount = userCourses ? userCourses.length : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Library</h1>
        <p className="text-gray-600 text-sm mt-1">Explore your AI-generated guides, courses and roadmaps</p>
      </div>
      
      {/* Loading state */}
      {userCourses === undefined && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading your content...</p>
        </div>
      )}
      
      {userCourses !== undefined && (
        <>
          {/* Category Tabs */}
          <div className="flex space-x-2 border-b border-gray-200 mb-6">
            <button 
          onClick={() => setActiveTab('courses')}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'courses' 
              ? 'bg-white text-gray-900 font-semibold shadow-sm border-b-2 border-blue-500' 
              : 'text-gray-600 hover:text-gray-800 hover:border-b hover:border-gray-300'
          }`}
        >
          <Book className="w-4 h-4 mr-1.5" />
          Courses
        </button>
        <button 
          onClick={() => setActiveTab('guides')}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'guides' 
              ? 'bg-white text-gray-900 font-semibold shadow-sm border-b-2 border-blue-500' 
              : 'text-gray-600 hover:text-gray-800 hover:border-b hover:border-gray-300'
          }`}
        >
          <FileText className="w-4 h-4 mr-1.5" />
          Guides
        </button>
        <button 
          onClick={() => setActiveTab('roadmaps')}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'roadmaps' 
              ? 'bg-white text-gray-900 font-semibold shadow-sm border-b-2 border-blue-500' 
              : 'text-gray-600 hover:text-gray-800 hover:border-b hover:border-gray-300'
          }`}
        >
          <Map className="w-4 h-4 mr-1.5" />
          Roadmaps
        </button>
        <button 
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'quizzes' 
              ? 'bg-white text-gray-900 font-semibold shadow-sm border-b-2 border-blue-500' 
              : 'text-gray-600 hover:text-gray-800 hover:border-b hover:border-gray-300'
          }`}
        >
          <CheckSquare className="w-4 h-4 mr-1.5" />
          Quizzes
        </button>
      </div>
      
      {/* Top Controls - Search & New Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-2/3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <button 
          onClick={() => router.push('/Ai-Roadmap/help')}
          className="bg-black text-white rounded-md px-4 py-2 font-medium flex items-center gap-1 hover:bg-gray-800 transition"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>
      
      {/* Usage Info */}
      <div className="flex items-center justify-between text-sm mb-6">
        <p className="text-gray-600">You have {totalCourseCount} {totalCourseCount === 1 ? 'course' : 'courses'}</p>
        <Link href="/dashboard/upgrade" className="text-blue-600 hover:text-blue-800 hover:underline transition">
          Need more? Upgrade
        </Link>
      </div>
      
      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map(course => {
          // Calculate total lessons count across all modules
          const totalLessons = course.modules.reduce((total, module) => {
            return total + module.lessons.length;
          }, 0);
          
          return (
            <div 
              key={course._id} 
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => {
                // Navigate to course detail page when clicked
                window.location.href = `/Ai-Roadmap/indra/${course._id}`;
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{course.courseTitle}</h3>
                <button 
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
                  onClick={(e) => {
                    // Prevent triggering the parent onClick
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <FolderOpen className="w-4 h-4 text-gray-500" />
                  <span>{course.modules.length} modules</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-1">
                  <PieChart className="w-4 h-4 text-gray-500" />
                  <span>0% complete</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Empty State (shows when no courses match search) */}
      {filteredCourses.length === 0 && (
        <div className="text-center p-8 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">
            {userCourses === null || userCourses.length === 0 
              ? "You haven't created any courses yet." 
              : "No courses found matching your search."}
          </p>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SavedPage;
