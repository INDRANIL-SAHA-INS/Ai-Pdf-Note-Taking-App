import React, { useEffect } from 'react'

const pdfviewer = ({ fileUrl }) => {
  
  useEffect(() => {
    if (fileUrl) {
      console.log("PDF URL:", fileUrl);
    }
  }, [fileUrl]);

  // Add more parameters to completely remove all UI elements
  const pdfUrlWithParams = fileUrl ? 
    `${fileUrl}` : '';

  return (
    <div className="pdf-viewer h-full w-full" >
      <iframe 
        src={pdfUrlWithParams}
        height={"100%"}
        width={"100%"}
        className="h-full w-full hide-scrollbar"
      />
      
    </div>
  )
}

export default pdfviewer
