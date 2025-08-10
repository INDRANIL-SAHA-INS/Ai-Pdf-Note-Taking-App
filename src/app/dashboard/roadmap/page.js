"use client"
import React from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'

const RoadmapsPage = () => {
  // Roadmap data with "New" badges where needed
  const roadmaps = [
    // Column 1
    [
      { title: "Frontend", isNew: false },
      { title: "Full Stack", isNew: false },
      { title: "AI and Data Scientist", isNew: false },
      { title: "PostgreSQL", isNew: false },
      { title: "Software Architect", isNew: false },
      { title: "Game Developer", isNew: false },
      { title: "Product Manager", isNew: false }
    ],
    // Column 2
    [
      { title: "Backend", isNew: false },
      { title: "AI Engineer", isNew: true },
      { title: "Android", isNew: true },
      { title: "Blockchain", isNew: false },
      { title: "Cyber Security", isNew: false },
      { title: "Technical Writer", isNew: false },
      { title: "Engineering Manager", isNew: false }
    ],
    // Column 3
    [
      { title: "DevOps", isNew: false },
      { title: "Data Analyst", isNew: false },
      { title: "iOS", isNew: false },
      { title: "QA", isNew: false },
      { title: "UX Design", isNew: false },
      { title: "MLOps", isNew: false },
      { title: "Developer Relations", isNew: false }
    ]
  ];

  return (
    <div className="h-full bg-white text-black overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-4 py-6 h-full flex flex-col">
        {/* Header Section */}
        <div className="text-center mb-4 flex-shrink-0">
          {/* Main Title with Glow Effect */}
          <h1 className="text-4xl font-bold text-black mb-3" 
              style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 0, 0, 0.2)' }}>
            Developer Roadmaps
          </h1>
          
          {/* Description Paragraph */}
          <p className="text-base text-gray-700 max-w-3xl mx-auto mb-5 leading-relaxed">
            roadmap.sh is a community effort to create roadmaps, guides and other educational content 
            to help guide developers in picking up a path and guide their learnings.
          </p>
          
          {/* Role-based Roadmaps Tag */}
          <div className="inline-block">
            <span className="px-3 py-1 border border-gray-400 rounded-full text-gray-700 text-sm bg-transparent">
              Role-based Roadmaps
            </span>
          </div>
        </div>

        {/* Roadmaps Grid Section - Centered */}
        <div className="flex justify-center flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl w-full">
            {roadmaps.map((column, columnIndex) => (
              <div key={columnIndex} className="space-y-2">
                {column.map((roadmap, index) => (
                  <div 
                    key={index}
                    className="bg-white border-2 border-black rounded-lg p-3 flex justify-between items-center hover:border-gray-700 transition-colors cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-black font-medium text-sm">{roadmap.title}</span>
                      {roadmap.isNew && (
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                          <span className="text-xs text-black">New</span>
                        </div>
                      )}
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-black transition-colors" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Create Roadmap Button */}
        <div className="text-center mt-6 flex-shrink-0">
          <button className="inline-flex items-center space-x-2 px-5 py-2 border-2 border-black rounded-full bg-transparent text-black hover:bg-gray-100 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create your own Roadmap</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoadmapsPage
