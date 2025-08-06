import { NextResponse } from 'next/server';
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function GET(request) {
  try {
    // Get the PDF URL from query parameters
    const { searchParams } = new URL(request.url);
    const pdfUrl = searchParams.get('pdfurl');
    
    if (!pdfUrl) {
      console.error("PDF URL is missing in request");
      return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 });
    }

    console.log("Starting PDF processing for URL:", pdfUrl);

    // Step 1: Fetch the PDF file from the dynamic URL
    const pdfResponse = await fetch(pdfUrl, {
      // Add proper headers for PDF fetching
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!pdfResponse.ok) {
      console.error("Failed to fetch PDF, status:", pdfResponse.status, "statusText:", pdfResponse.statusText);
      
      // Try to get more info about the error
      let responseText;
      try {
        responseText = await pdfResponse.text();
        console.log("Error response from PDF fetch:", responseText.substring(0, 200));
      } catch (e) {
        console.error("Could not read error response:", e);
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch PDF', 
        status: pdfResponse.status,
        statusText: pdfResponse.statusText,
        texts: [] 
      }, { status: 500 });
    }

    console.log("✅ PDF fetched successfully from:", pdfUrl);
    console.log("Response headers:", Object.fromEntries(pdfResponse.headers.entries()));
    console.log("Response type:", pdfResponse.type);

    // Step 2: Convert the response into a Blob and ArrayBuffer for diagnosis
    const pdfBlob = await pdfResponse.blob();
    console.log("PDF Blob size:", pdfBlob.size, "bytes");
    console.log("PDF Blob type:", pdfBlob.type);

    if (pdfBlob.size === 0) {
      console.error("PDF Blob is empty");
      return NextResponse.json({ error: 'PDF content is empty', texts: [] }, { status: 400 });
    }

    // Try extraction method
    let extractedDocs = [];

    try {
      console.log("Starting PDF parsing with WebPDFLoader...");
      const pdfLoader = new WebPDFLoader(pdfBlob);
      extractedDocs = await pdfLoader.load();
      console.log("PDF parsing complete. Documents extracted:", extractedDocs.length);
    } catch (loaderError) {
      console.error("WebPDFLoader failed:", loaderError);
      return NextResponse.json({ 
        error: 'Failed to extract text from PDF: ' + loaderError.message,
        texts: [] 
      }, { status: 200 });
    }
    
    if (extractedDocs.length === 0) {
      console.error("No documents extracted from PDF. This might be a scanned/image PDF without text layers.");
      return NextResponse.json({ 
        error: 'No text content extracted from PDF. This may be a scanned document or image-based PDF without text layers.', 
        texts: [] 
      }, { status: 200 });
    }
    
    // Log sample of extracted content
    console.log("Sample of extracted content:", 
      extractedDocs[0].pageContent.substring(0, 100) + "...");
    console.log("Character count in first document:", extractedDocs[0].pageContent.length);

    // Step 4: Clean up text in each document
    console.log("Cleaning extracted text...");
    const cleanedDocs = extractedDocs.map(doc => ({
      ...doc,
      pageContent: doc.pageContent.replace(/\s+/g, ' ').trim()
    }));

    // Step 5: Split cleaned content into smaller chunks
    console.log("Splitting content into chunks...");
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 300,      // Smaller chunk size for more precise retrieval
      chunkOverlap: 50     // Smaller overlap for context
    });
    const splitContents = await textSplitter.splitDocuments(cleanedDocs);
    
    console.log("Text splitting complete. Number of chunks:", splitContents.length);
    
    if (splitContents.length === 0) {
      console.error("No text chunks created after splitting");
      return NextResponse.json({ 
        error: 'Failed to split PDF content into chunks', 
        texts: [] 
      }, { status: 200 });
    }

    // Step 6: Extract just the text from the chunks
    const onlyTextChunks = splitContents.map(chunk => chunk.pageContent);
    
    console.log("First few text chunks:", onlyTextChunks.slice(0, 2));
    console.log("Total text chunks created:", onlyTextChunks.length);

    // Step 7: Return the extracted content as a JSON response
    return NextResponse.json(
      { texts: onlyTextChunks },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        stack: error.stack,
        texts: [] 
      }, 
      { status: 500 }
    );
  }
}