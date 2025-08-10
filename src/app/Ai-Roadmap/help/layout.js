
"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "./_components/sidebar";
import { useSearchParams, useRouter } from "next/navigation";

export default function Layout({ children }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlFormat = searchParams.get('format') || "course";
  
  // Initialize state with a default value, then update on client
  const [selectedFormat, setSelectedFormat] = useState("course");

  // Effect to sync state with URL, runs only on client-side
  useEffect(() => {
    setSelectedFormat(urlFormat);
  }, [urlFormat]);

  const handleFormatChange = (newFormat) => {
    setSelectedFormat(newFormat);
    // Always navigate to the main help page with the format parameter
    router.push(`/Ai-Roadmap/help?format=${newFormat}`);
  };

  // Clone children to pass props
  const childrenWithProps = React.cloneElement(children, {
    selectedFormat: selectedFormat,
    setSelectedFormat: handleFormatChange,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar selectedFormat={selectedFormat} setSelectedFormat={handleFormatChange} />
      <main className="flex-1 overflow-auto p-6">
        {childrenWithProps}
      </main>
    </div>
  );
}
