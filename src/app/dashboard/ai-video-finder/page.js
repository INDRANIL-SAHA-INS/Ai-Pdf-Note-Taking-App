"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useMutation, useAction } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { api } from "convex/_generated/api"
import axios from "axios"
import { toast } from "sonner"

const Ai_video_findeer = () => {
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [addingToWorkspace, setAddingToWorkspace] = useState({})
  const [videoToDocIdMapping, setVideoToDocIdMapping] = useState({})
  
  const { user } = useUser()
  const addYoutubeVideo = useMutation(api.youtube.addYoutubeVideo)
  const addYoutubeTranscriptEmbeddings = useAction(api.youtubeEmbeddings.addYoutubeTranscriptEmbeddings)

  // Load state from sessionStorage on component mount
  useEffect(() => {
    const savedQuery = sessionStorage.getItem('ai-video-finder-query')
    const savedResponse = sessionStorage.getItem('ai-video-finder-response')
    const savedMapping = sessionStorage.getItem('ai-video-finder-mapping')
    
    if (savedQuery) {
      setQuery(savedQuery)
    } else {
      setQuery("learn javascript full course") // default if nothing saved
    }
    
    if (savedResponse) {
      try {
        setResponse(JSON.parse(savedResponse))
      } catch (e) {
        console.error("Error parsing saved response:", e)
      }
    }

    if (savedMapping) {
      try {
        setVideoToDocIdMapping(JSON.parse(savedMapping))
      } catch (e) {
        console.error("Error parsing saved mapping:", e)
      }
    }
  }, [])

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (query) {
      sessionStorage.setItem('ai-video-finder-query', query)
    }
  }, [query])

  useEffect(() => {
    if (response) {
      sessionStorage.setItem('ai-video-finder-response', JSON.stringify(response))
    }
  }, [response])

  // Save mapping to sessionStorage whenever it changes
  useEffect(() => {
    if (Object.keys(videoToDocIdMapping).length > 0) {
      sessionStorage.setItem('ai-video-finder-mapping', JSON.stringify(videoToDocIdMapping))
    }
  }, [videoToDocIdMapping])

  const searchVideos = async () => {
    setLoading(true)
    setError("")
    setResponse("")
    
    try {
      const fetchResponse = await fetch(`http://127.0.0.1:5000/search-videos?query=${encodeURIComponent(query)}&limit=20`)
      
      if (!fetchResponse.ok) {
        throw new Error(`HTTP error! status: ${fetchResponse.status}`)
      }
      
      const data = await fetchResponse.json() // Changed to parse JSON
      setResponse(data)
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    const number = parseInt(num)
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M'
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K'
    }
    return number.toString()
  }

  const getEngagementRate = (video) => {
    const views = parseInt(video.engagement_metrics.views)
    const likes = parseInt(video.engagement_metrics.likes)
    const comments = parseInt(video.engagement_metrics.comments)
    
    if (views === 0) return "0%"
    
    const engagementRate = ((likes + comments) / views) * 100
    return engagementRate.toFixed(2) + "%"
  }

  const getVideoQualityIndicator = (video) => {
    const views = parseInt(video.engagement_metrics.views)
    const likes = parseInt(video.engagement_metrics.likes)
    
    if (views === 0) return { text: "New Video", color: "text-blue-600" }
    
    const likeRatio = (likes / views) * 100
    
    if (likeRatio >= 1.5) return { text: "Highly Rated", color: "text-green-600" }
    if (likeRatio >= 0.8) return { text: "Well Liked", color: "text-green-500" }
    if (likeRatio >= 0.4) return { text: "Good Quality", color: "text-yellow-600" }
    return { text: "Average Rating", color: "text-gray-600" }
  }

  const formatDuration = (duration) => {
    if (!duration) {
      return "Duration unavailable"
    }
    
    // Duration is already formatted as string from API (e.g., "3:26:43", "48:17", "22:15:57")
    return duration
  }

  const addToWorkspace = async (video) => {
    if (!user) {
      toast.error("You must be signed in to add videos to workspace.")
      return
    }

    const videoId = video.videoId
    setAddingToWorkspace(prev => ({ ...prev, [videoId]: true }))

    // Show loading toast
    const loadingToast = toast.loading(`Adding "${video.title}" to workspace...`)

    let docId = null // Declare docId outside try block

    try {
      // Step 1: Save video metadata to Convex
      const youtubeUrl = video.url
      docId = await addYoutubeVideo({
        url: youtubeUrl,
        createdBy: user.primaryEmailAddress?.emailAddress || "unknown_user",
        createdAt: Date.now(),
        title: video.title,
        description: `Added from AI Video Finder - Overall Score: ${Math.round(video.overall_score).toLocaleString()}`
      })

      // Save response to variable and log it
      const addYoutubeVideoResponse = docId
      console.log("addYoutubeVideo response:", addYoutubeVideoResponse)
      console.log("Video saved to workspace with ID:", docId)

      // Step 2: Try to get transcript and save embeddings
      try {
        const transcriptResponse = await axios.get(`http://127.0.0.1:5000/transcript?video_id=${videoId}`, { timeout: 10000 })
        
        if (transcriptResponse.data.success && transcriptResponse.data.data?.transcript?.chunks) {
          const transcriptData = transcriptResponse.data.data
          const validChunks = transcriptData.transcript.chunks.filter(chunk => {
            return chunk && 
                   typeof chunk.id === 'number' && 
                   chunk.text && 
                   chunk.timestamp && 
                   typeof chunk.timestamp.start === 'number' && 
                   typeof chunk.timestamp.end === 'number' && 
                   typeof chunk.timestamp.duration === 'number' &&
                   chunk.analytics &&
                   typeof chunk.analytics.word_count === 'number'
          })

          if (validChunks.length > 0) {
            const processedChunks = validChunks.map(chunk => ({
              id: chunk.id,
              text: chunk.text,
              embeddingText: chunk.embedding_text || chunk.text,
              timestamp: {
                start: chunk.timestamp.start,
                end: chunk.timestamp.end,
                duration: chunk.timestamp.duration,
                formatted: chunk.timestamp.formatted,
              },
              analytics: {
                word_count: chunk.analytics.word_count,
                speaking_rate: chunk.analytics.speaking_rate,
              },
              createdAt: Date.now(),
            }))

            await addYoutubeTranscriptEmbeddings({
              fileId: docId,
              chunks: processedChunks
            })

            toast.success(`✅ Video "${video.title}" added to workspace with transcript data!`, {
              id: loadingToast,
            })
          } else {
            toast.success(`✅ Video "${video.title}" added to workspace (no transcript available)`, {
              id: loadingToast,
            })
          }
        } else {
          toast.success(`✅ Video "${video.title}" added to workspace (no transcript available)`, {
            id: loadingToast,
          })
        }
      } catch (transcriptError) {
        console.warn("Failed to get transcript:", transcriptError)
        toast.success(`✅ Video "${video.title}" added to workspace (transcript processing failed)`, {
          id: loadingToast,
        })
      }

    } catch (error) {
      console.error("Failed to add video to workspace:", error)
      toast.error(`❌ Failed to add video to workspace: ${error.message}`, {
        id: loadingToast,
      })
    } finally {
      // Update the mapping to track this video as added to workspace
      // This happens only after the entire process is complete (success or failure)
      if (docId) {
        setVideoToDocIdMapping(prev => ({
          ...prev,
          [video.videoId]: docId
        }))
      }
      setAddingToWorkspace(prev => ({ ...prev, [videoId]: false }))
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className='text-2xl font-bold mb-4'>AI Video Finder</h1>
      <p className='text-gray-600 mb-6'>Find relevant videos based on your search query.</p>
      
      {/* Search Input Section */}
      <div className="mb-6">
        <div className="flex gap-3 mb-4">
          <Input
            type="text"
            placeholder="Enter your search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={searchVideos} 
            disabled={loading || !query.trim()}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? "Searching..." : "Search Videos"}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Searching for videos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {response && !loading && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Search Results Summary</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Query: <span className="font-medium">{response.query}</span></p>
                <p>Total Videos Analyzed: <span className="font-medium">{response.total_videos_analyzed}</span></p>
                <p>Final Recommendations: <span className="font-medium">{response.final_recommendations}</span></p>
                <p>Success: <span className="font-medium text-green-600">{response.success ? 'Yes' : 'No'}</span></p>
              </div>
            </div>

            {response.videos && response.videos.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Top Video Recommendations</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {response.videos.map((video, index) => {
                    const isAddedToWorkspace = videoToDocIdMapping[video.videoId]
                    
                    return (
                      <div key={video.videoId} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        {/* Video Thumbnail */}
                        <div className="relative">
                          <img 
                            src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Video Details */}
                        <div className="p-4">
                          {/* Title */}
                          <h4 className="font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight">
                            {video.title}
                          </h4>

                          {/* Overall Score */}
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-blue-800">AI Score</span>
                              <span className="text-lg font-bold text-blue-900">
                                {Math.round(video.overall_score).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-blue-600">Engagement Rate:</span>
                              <span className="font-medium text-blue-700">{getEngagementRate(video)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-1">
                              <span className="text-blue-600">Quality:</span>
                              <span className={`font-medium ${getVideoQualityIndicator(video).color}`}>
                                {getVideoQualityIndicator(video).text}
                              </span>
                            </div>
                          </div>

                          {/* Engagement Metrics */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium text-gray-900">
                                {formatDuration(video.duration)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Views:</span>
                              <span className="font-medium text-gray-900">
                                {formatNumber(video.engagement_metrics.views)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Likes:</span>
                              <span className="font-medium text-gray-900">
                                {formatNumber(video.engagement_metrics.likes)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Comments:</span>
                              <span className="font-medium text-gray-900">
                                {formatNumber(video.engagement_metrics.comments)}
                              </span>
                            </div>
                          </div>

                          {/* Conditional Button - Add to Workspace OR Go to Workspace */}
                          {isAddedToWorkspace ? (
                            <Link href={`/workspace/youtube/${videoToDocIdMapping[video.videoId]}`}>
                              <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                                Go to Workspace
                              </Button>
                            </Link>
                          ) : (
                            <Button 
                              onClick={() => addToWorkspace(video)}
                              disabled={addingToWorkspace[video.videoId]}
                              className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400"
                            >
                              {addingToWorkspace[video.videoId] ? "Adding..." : "Add to Workspace"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!response && !loading && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500">Enter a search query and click "Search Videos" to find relevant videos.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Ai_video_findeer
