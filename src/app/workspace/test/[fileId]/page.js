"use client"
import React, { use, useEffect, useState } from 'react'
import { useParams } from 'next/navigation';
import TestSpaceHeader from '../../_components/testspaceHeader';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import axios from 'axios';



const ai_take_test_from_context = () => {
  const {fileId}=useParams()
  
  const getfileinfo = useQuery(api.PdfStorage.getfilerecord, { fileId });
  const getAllDocuments = useQuery(api.PdfStorage.get_allthe_documents_with_matching_fileId, { fileId });
  
  // State for test data and loading
  const [testData, setTestData] = useState(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const callai = async () => {
    try {
      if (!getAllDocuments || !getAllDocuments.success) {
        console.error("No document data available for AI test generation");
        return;
      }

      setIsGeneratingTest(true);
      setTestStarted(true);

      const contextText = getAllDocuments.combinedText;
      const prompt = `Based on the following context: ${contextText}. Create a comprehensive test paper with the following structure:

1. Multiple Choice Questions (4 options each) - 1 mark each (5 questions)
2. Short Answer Questions - 2 marks each (5 questions)
3. Medium Answer Questions - 5 marks each (3 questions)
4. Long Answer Questions - 10 marks each (2 questions)

Format the response as JSON with this structure:
{
  "title": "Test Paper Title",
  "totalMarks": "Total marks",
  "timeLimit": "Suggested time limit",
  "sections": [
    {
      "type": "mcq",
      "title": "Multiple Choice Questions",
      "instructions": "Choose the correct option",
      "questions": [
        {
          "id": 1,
          "question": "Question text",
          "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
          "correctAnswer": "A",
          "marks": 1
        }
      ]
    },
    {
      "type": "short",
      "title": "Short Answer Questions",
      "instructions": "Answer in 2-3 sentences",
      "questions": [
        {
          "id": 1,
          "question": "Question text",
          "marks": 2
        }
      ]
    }
  ]
}

Make sure the questions are relevant to the provided context and appropriate for the academic level.`;
      
      console.log("Generating AI test...");
      const groqResponse = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are an expert teacher creating academic test papers. Always respond with valid JSON format." },
            { role: "user", content: prompt },
          ],
          model: "llama-3.3-70b-versatile"
        })
      });

      if (groqResponse.ok) {
        const result = await groqResponse.json();
        console.log("AI Test Generated:", result);
        
        try {
          // Parse the AI response - handle different response structures
          let contentText;
          if (result.choices && result.choices[0] && result.choices[0].message) {
            // OpenAI-style response
            contentText = result.choices[0].message.content;
          } else if (result.content) {
            // Direct content property
            contentText = result.content;
          } else {
            // Fallback - use the entire result as string
            contentText = JSON.stringify(result);
          }

          // Extract JSON from markdown code blocks if present
          const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/);
          const jsonContent = jsonMatch ? jsonMatch[1] : contentText;

          const testContent = JSON.parse(jsonContent);
          setTestData(testContent);
        } catch (parseError) {
          console.error("Error parsing test data:", parseError);
          // Fallback: store raw response with better handling
          let fallbackContent;
          if (result.content) {
            fallbackContent = result.content;
          } else if (result.choices && result.choices[0]) {
            fallbackContent = result.choices[0].message?.content || JSON.stringify(result);
          } else {
            fallbackContent = JSON.stringify(result);
          }
          
          setTestData({
            title: "Generated Test Paper",
            content: fallbackContent,
            raw: true // Flag to indicate this is raw content
          });
        }
      } else {
        console.error("Error generating AI test:", groqResponse.statusText);
      }
    } catch (error) {
      console.error("Error in callai function:", error);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  // Single useEffect to handle all data when it loads
  useEffect(() => {
    // Handle file info
    if (getfileinfo !== undefined) {
      if (getfileinfo === null) {
        console.error("File information not found for fileId:", fileId);
      } else {
        console.log("File information:", getfileinfo);
      }
    }

    // Handle documents data
    if (getAllDocuments !== undefined) {
      if (getAllDocuments === null) {
        console.error("No documents found for fileId:", fileId);
      } else {
        console.log("All documents for test context:", getAllDocuments);
        
        if (getAllDocuments.success) {
          console.log("Combined text for AI:", getAllDocuments.combinedText);
          console.log("Document count:", getAllDocuments.documentCount);
          console.log("Total characters:", getAllDocuments.totalCharacters);
          
          // Now you can send getAllDocuments.combinedText to your AI for test generation
          // Example: await callAIForTestGeneration(getAllDocuments.combinedText);
        } else {
          console.error("Failed to retrieve documents:", getAllDocuments.message);
        }
      }
    }
  }, [getfileinfo, getAllDocuments, fileId]);

  return (
    <>
      <TestSpaceHeader 
        FileName={getfileinfo?.fileName || "Loading..."} 
        onStartTest={callai}
      />
      
      <div className="min-h-screen bg-gray-50 p-6">
        {!testStarted ? (
          // Pre-test state
          <div className="max-w-4xl mx-auto text-center py-16">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Your Test</h2>
              <p className="text-gray-600 mb-6">
                Click "Start Test" to begin generating your personalized test based on the document content.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  <strong>Document:</strong> {getfileinfo?.fileName || "Loading..."}
                </p>
                <p className="text-blue-600 text-sm mt-2">
                  Test will be generated based on this document's content
                </p>
              </div>
            </div>
          </div>
        ) : isGeneratingTest ? (
          // Loading state
          <div className="max-w-4xl mx-auto text-center py-16">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Generating Your Test...</h2>
              <p className="text-gray-600">
                Our AI is creating personalized questions based on your document content.
              </p>
            </div>
          </div>
        ) : testData ? (
          // Test display state
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Test Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <h1 className="text-2xl font-bold">{testData.title || "Test Paper"}</h1>
                <div className="flex justify-between items-center mt-4 text-blue-100">
                  <span>Total Marks: {testData.totalMarks || "N/A"}</span>
                  <span>Time Limit: {testData.timeLimit || "N/A"}</span>
                </div>
              </div>

              {/* Test Content */}
              <div className="p-6">
                {testData.sections ? (
                  // Structured test data
                  testData.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-8">
                      <div className="border-l-4 border-blue-500 pl-4 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
                        <p className="text-gray-600 text-sm">{section.instructions}</p>
                      </div>

                      {section.questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-medium text-gray-800">
                              Q{question.id || questionIndex + 1}. {question.question}
                            </h3>
                            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {question.marks} mark{question.marks > 1 ? 's' : ''}
                            </span>
                          </div>

                          {section.type === 'mcq' && question.options ? (
                            // Multiple choice options
                            <div className="space-y-2 ml-4">
                              {question.options.map((option, optionIndex) => (
                                <label key={optionIndex} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded">
                                  <input 
                                    type="radio" 
                                    name={`q${sectionIndex}_${questionIndex}`}
                                    className="text-blue-600" 
                                  />
                                  <span className="text-gray-700">{option}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            // Text answer area
                            <textarea 
                              className="w-full mt-2 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={section.type === 'short' ? 3 : section.type === 'medium' ? 5 : 8}
                              placeholder="Write your answer here..."
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  // Fallback for raw content
                  <div className="space-y-4">
                    {testData.raw ? (
                      // Handle raw markdown/JSON content
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Generated Test Content</h3>
                        <div className="prose max-w-none">
                          <pre className="whitespace-pre-wrap bg-white border border-gray-200 p-4 rounded-md text-sm overflow-x-auto">
                            {testData.content}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      // Handle other fallback content
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded-lg text-sm">
                          {testData.content}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <button className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                      Save Draft
                    </button>
                    <button className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                      Submit Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Error state
          <div className="max-w-4xl mx-auto text-center py-16">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to Generate Test</h2>
              <p className="text-gray-600 mb-6">
                There was an error generating your test. Please try again.
              </p>
              <button 
                onClick={callai}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ai_take_test_from_context