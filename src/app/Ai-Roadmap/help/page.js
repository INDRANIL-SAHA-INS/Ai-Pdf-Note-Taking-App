"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Book, FileText, Map, Sparkles } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";

const formatOptions = [
  { label: "Course", icon: Book, value: "course" },
  { label: "Guide", icon: FileText, value: "guide" },
  { label: "Roadmap", icon: Map, value: "roadmap" },
];

const Page = ({ selectedFormat, setSelectedFormat } = {}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [topic, setTopic] = useState("");
  const [showQuestions, setShowQuestions] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  

  //save the ai response in the database
  const saved_course_Data=useMutation(api.coursesData.createCourse)

  const handleSaveCourse = async () => {
    if (!courseData) return;
    if (!user) {
      setSaveStatus("error");
      alert("You must be logged in to save a course");
      return;
    }

    setIsLoading(true);
    setSaveStatus("saving");
    try {
      // Prepare the data according to the schema requirements
      const courseId = await saved_course_Data({
        topic: topic,
        format: format,
        createdBy: user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress,
        showQuestions: showQuestions,
        courseTitle: courseData.courseTitle,
        modules: courseData.modules
      });
      setSaveStatus("success");
      setTimeout(() => {
        router.push(`/Ai-Roadmap/indra/${courseId}`); // Redirect to dynamic route with course ID in path
      }, 1500);
    } catch (error) {
      console.error("Error saving course:", error);
      setSaveStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const urlFormat = searchParams.get('format') || "course";
  const [format, setFormat] = useState(urlFormat);
  
  
  const handleFormatChange = (newFormat) => {
    setFormat(newFormat);
    
    const url = new URL(window.location.href);
    url.searchParams.set('format', newFormat);
    router.push(url.pathname + url.search);
    
    if (setSelectedFormat) {
      setSelectedFormat(newFormat);
    }
  };
  
  useEffect(() => {
    setFormat(urlFormat);
  }, [urlFormat]);

  const callai_course_outline = async () => {
    if (!topic.trim()) return;
    
    setIsLoading(true);
    setCourseData(null);
    
    const prompt = `You are an expert curriculum architect with 15+ years of experience designing educational programs for beginners to advanced learners.\n\nYour task is to create a complete, logically progressive, and highly structured course outline for learning ${topic} from scratch to advanced mastery.\n\nSTRUCTURE RULES:\n1. Divide the course into **5–10 MODULES** (major topics).  \n   - Each module should represent a major milestone or skill area.\n   - Order modules in a natural learning progression (fundamentals → intermediate → advanced → specialized → mastery).\n2. Each module must contain **3–8 LESSONS** (subtopics) that fully cover that module's skill area.  \n   - Lessons should be actionable, clear, and written as learning objectives (e.g., \"Master Variables and Data Types\" instead of \"Variables\").\n   - Lessons must progress from simpler concepts to more advanced ones within the module.\n3. Do **NOT** include any actual learning content yet — only the structure (titles & IDs).\n\nTECHNICAL OUTPUT FORMAT:\n- Return only a valid JSON object in the exact format below:\n{\n  \"courseTitle\": \"string\",\n  \"modules\": [\n    {\n      \"id\": \"unique-lowercase-hyphenated-id\",\n      \"title\": \"Module Title\",\n      \"lessons\": [\n        { \"id\": \"unique-lowercase-hyphenated-id\", \"title\": \"Lesson Title\" }\n      ]\n    }\n  ]\n}\n\nID NAMING RULES:\n- All IDs must be lowercase, hyphen-separated, and unique across the whole course.\n- Module IDs = condensed version of the module title (e.g., \"javascript-fundamentals\").\n- Lesson IDs = module-id + short-version-of-lesson-title (e.g., \"javascript-fundamentals-variables\").\n\nQUALITY RULES:\n- No duplicate lesson names.\n- No overly broad lessons like \"Basics\" — always be specific and measurable.\n- Avoid overlapping content between modules; each topic should appear only once in the entire roadmap.\n\nEXAMPLE:\n{\n  \"courseTitle\": \"JavaScript: From Fundamentals to Advanced\",\n  \"modules\": [\n    {\n      \"id\": \"javascript-fundamentals\",\n      \"title\": \"JavaScript Fundamentals\",\n      \"lessons\": [\n        { \"id\": \"javascript-fundamentals-intro\", \"title\": \"Introduction to JavaScript and Its Role in Web Development\" },\n        { \"id\": \"javascript-fundamentals-environment\", \"title\": \"Setting Up a Development Environment (VS Code, Browser Console)\" },\n        { \"id\": \"javascript-fundamentals-variables\", \"title\": \"Mastering Variables, Data Types, and Operators\" }\n      ]\n    }\n  ]\n}\n\nTASK:\nNow, create the course outline for: ${topic}  \nReturn only the JSON object — no explanations, no notes, no extra formatting.`;
    
    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are an expert curriculum architect." },
            { role: "user", content: prompt },
          ],
          model: "llama-3.3-70b-versatile"
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Raw AI Response:", result);
        
        try {
          // Extract content from the response
          let content = result.content.trim();
          console.log("Extracted content:", content);
          
          // Check if content is wrapped in code block and clean it
          if (content.startsWith("```")) {
            console.log("Detected code block, cleaning...");
            content = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
            console.log("Cleaned content:", content);
          }
          
          // Parse the JSON content
          console.log("Attempting to parse JSON...");
          const parsedData = JSON.parse(content);
          
          // Log the structure with more details
          console.log("AI Parsed Course Data:", parsedData);
          console.log("Course Title:", parsedData.courseTitle);
          console.log("Number of Modules:", parsedData.modules.length);
          
          parsedData.modules.forEach((module, index) => {
            console.log(`Module ${index + 1}:`, {
              id: module.id,
              title: module.title,
              lessonCount: module.lessons.length
            });
          });
          
          setCourseData(parsedData);
        } catch (parseError) {
          console.error("Failed to parse course data JSON:", parseError);
          console.error("Content that failed to parse:", result.content);
          alert("Failed to parse course data. Please try again or refine your topic.");
        }
      } else {
        console.error("Error from AI API:", response.statusText);
        alert("AI failed to generate a course outline. Please try again later.");
      }
    } catch (error) {
      console.error("Error calling AI for course outline:", error);
      alert("Error connecting to the AI service. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 m-4 flex flex-col items-center">
        <div className="w-full text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">What can I help you learn?</h1>
          <p className="text-base text-gray-600">Enter a topic below to generate a personalized course for it.</p>
        </div>

        <div className="w-full mb-6">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
            What can I help you learn?
          </label>
          <input
            id="topic"
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-base"
            placeholder="javascript"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
        </div>

        <div className="w-full mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Choose the format</label>
          <div className="flex gap-4">
            {formatOptions.map(option => {
              const Icon = option.icon;
              const active = format === option.value;
              return (
                <div
                  key={option.label}
                  onClick={() => handleFormatChange(option.value)}
                  className={`flex flex-col items-center justify-center flex-1 px-4 py-4 rounded-xl border cursor-pointer transition-all
                    ${active ? "bg-blue-100 border-blue-500 text-blue-700 shadow" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"}`}
                >
                  <Icon className="w-7 h-7 mb-1" />
                  <span className="font-semibold text-base">{option.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full flex items-center mb-8">
          <input
            id="questions"
            type="checkbox"
            checked={showQuestions}
            onChange={e => setShowQuestions(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="questions" className="ml-2 block text-sm text-gray-700">
            Answer the following questions for a better course
          </label>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-lg font-semibold py-3 rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!topic.trim() || isLoading}
          onClick={callai_course_outline}
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 text-yellow-400" />
              Generate
            </>
          )}
        </button>
        
        {courseData && (
          <div className="w-full mt-8 border-t pt-6">
            <h2 className="text-2xl font-bold text-center mb-4">{courseData.courseTitle}</h2>
            
            <div className="space-y-4">
              {courseData.modules.map((module, index) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {index + 1}. {module.title}
                  </h3>
                  <ul className="space-y-2 pl-6">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <li key={lesson.id} className="text-gray-700">
                        {index + 1}.{lessonIndex + 1} {lesson.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={handleSaveCourse}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saveStatus === "saving"}
              >
                {saveStatus === "saving" ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </span>
                ) : saveStatus === "error" ? (
                  "Error Saving. Try Again"
                ) : saveStatus === "success" ? (
                  "Saved Successfully!"
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
