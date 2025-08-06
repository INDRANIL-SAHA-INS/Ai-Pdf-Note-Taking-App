// Helper function to retrieve top K relevant transcript chunks using vector search
export async function retrieveTopKChunks(
  vectorStore,
  args,
  k
) {
  const results = await vectorStore.similaritySearch(args.query, k);
  return results
    .filter(doc =>
      doc.metadata?.fileId === args.fileId || doc.metadata?.fileid === args.fileId
    )
    .map(doc => doc.pageContent || doc.text);
}

// Helper function to retrieve the full transcript for a given fileId
export async function retrieveFullTranscript(
  vectorStore,
  args
) {
  // Use vector search to retrieve all chunks (large K)
  const results = await vectorStore.similaritySearch(args.query, 256); // Large K to get all
  const filteredResults = results.filter(doc =>
    doc.metadata?.fileId === args.fileId || doc.metadata?.fileid === args.fileId
  );
  return filteredResults.map(doc => doc.pageContent || doc.text);
}
