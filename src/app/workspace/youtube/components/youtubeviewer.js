import React from 'react'

const YoutubeViewer = ({ videoId }) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      {videoId ? (
        <iframe
          className="w-full h-full max-h-[90vh]"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <p className="text-lg">No video selected</p>
      )}
    </div>
  )
}

export default YoutubeViewer
