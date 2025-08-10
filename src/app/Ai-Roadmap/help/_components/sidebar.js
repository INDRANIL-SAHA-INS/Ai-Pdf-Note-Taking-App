"use client"
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Book, FileText, CheckSquare, Map, MessageCircle, Bookmark, ChevronDown, ChevronRight } from "lucide-react";

const createWithAiLinks = [
  {
    name: "Course",
    icon: Book,
    type: "format",
    format: "course"
  },
  {
    name: "Guide",
    icon: FileText,
    type: "format",
    format: "guide"
  },
  {
    name: "Roadmap",
    icon: Map,
    type: "format",
    format: "roadmap"
  },
  {
    name: "Quiz",
    icon: CheckSquare,
    type: "route",
    href: "/Ai-Roadmap/quiz" // Quiz page
  }
];

const myLearningLinks = [
  {
    name: "Saved",
    icon: Bookmark,
    href: "/Ai-Roadmap/help/saved",
    active: false,
  },
];

const Sidebar = ({ selectedFormat, setSelectedFormat }) => {
  const { user } = useUser();
  const router = useRouter();
  const [createWithAiOpen, setCreateWithAiOpen] = useState(false);
  
  // Function to handle format changes and update URL
  const handleFormatChange = (format) => {
    // Always navigate to the main help page with the format parameter
    router.push(`/Ai-Roadmap/help?format=${format}`);
    
    // Update the selected format state
    if (setSelectedFormat) {
      setSelectedFormat(format);
    }
  };

  return (
    <aside className="flex flex-col h-screen w-64 bg-gray-200 border-r border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Tutor</h1>
          <p className="text-xs text-gray-500 mt-1">Your personalized learning companion for any topic.</p>
        </div>
        {/* Navigation */}
        <div className="mt-2 px-2 flex-1 overflow-y-auto">
          {/* Create with AI section header - clickable */}
          <button 
            onClick={() => setCreateWithAiOpen(!createWithAiOpen)}
            className="w-full flex items-center justify-between px-2 py-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:bg-gray-100 rounded-lg"
          >
            <span>Create with AI</span>
            {createWithAiOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {/* Create with AI collapsible menu */}
          {createWithAiOpen && (
            <nav className="space-y-1 mb-6 pl-2">
              {createWithAiLinks.map((link) => {
                const active = selectedFormat === link.name;
                if (link.type === "route") {
                  return (
                    <button
                      key={link.name}
                      type="button"
                      onClick={() => router.push(link.href)}
                      className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium gap-3 mb-1 text-left text-gray-700 hover:bg-gray-100`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.name}
                    </button>
                  );
                } else if (link.type === "format") {
                  return (
                    <button
                      key={link.name}
                      type="button"
                      onClick={() => handleFormatChange(link.format)}
                      className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium gap-3 mb-1 text-left
                        ${active ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.name}
                    </button>
                  );
                }
                return (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => setSelectedFormat(link.name)}
                    className={`w-full flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium gap-3 mb-1 text-left
                      ${active ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500" : "text-gray-700 hover:bg-gray-100"}`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.name}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Ask AI Tutor - independent section */}
          <button
            type="button"
            onClick={() => router.push("/Ai-Roadmap/Ai-tutor")}
            className="w-full flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium gap-3 mb-6 text-left text-gray-700 hover:bg-gray-100"
          >
            <MessageCircle className="w-5 h-5" />
            Ask AI Tutor
          </button>
          
          <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">My Learning</div>
          <nav className="space-y-1">
            {myLearningLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium gap-3 mb-1
                  text-gray-700 hover:bg-gray-100`}
                passHref
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom User Info & CTA */}
      <div className="px-6 py-3 border-t border-gray-200 mt-auto shrink-0">
       
        {/* User Info */}
        <div className="flex items-center gap-3 cursor-pointer group">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border border-gray-300 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg font-bold">
              {user?.firstName?.[0] || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{user?.fullName || "Indranil Saha"}</div>
            <div className="text-xs text-gray-500 truncate">Free User</div>
          </div>
          {/* Clerk UserButton for dropdown/logout */}
          <div className="ml-2">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;