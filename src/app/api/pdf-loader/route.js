import { NextResponse } from 'next/server';
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function GET(request) {
  try {
    // Get the PDF URL from query parameters
    const { searchParams } = new URL(request.url);
    const pdfUrl = searchParams.get('pdfurl');
    
    if (!pdfUrl) {
      return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 });
    }

    // Step 1: Fetch the PDF file from the dynamic URL
    const pdfResponse = await fetch(pdfUrl);

    if (!pdfResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });
    }

    console.log("✅ PDF fetched successfully from:", pdfUrl);

    // Step 2: Convert the response into a Blob
    const pdfBlob = await pdfResponse.blob();

    // Step 3: Load and parse the PDF content
    const pdfLoader = new WebPDFLoader(pdfBlob);
    const extractedDocs = await pdfLoader.load();

    // Step 4: Clean up text in each document
    const cleanedDocs = extractedDocs.map(doc => ({
      ...doc,
      pageContent: doc.pageContent.replace(/\s+/g, ' ').trim()
    }));

    // Step 5: Split cleaned content into smaller chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 300,      // Smaller chunk size for more precise retrieval
      chunkOverlap: 50     // Smaller overlap for context
    });
    const splitContents = await textSplitter.splitDocuments(cleanedDocs);

    // Step 6: Extract just the text from the chunks
    const onlyTextChunks = splitContents.map(chunk => chunk.pageContent);

    // Step 7: Return the extracted content as a JSON response
    return NextResponse.json(
      { texts: onlyTextChunks },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}