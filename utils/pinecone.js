import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { embeddings } from "./embeddings.js";

const pinecone = new PineconeClient({apiKey: "pcsk_2iJdUy_H1TVFa2uvnEzUJ6d8wYUx1f8YKPr4uWmwPfbFuv5mjeX6rYcr6DaA5psay61t5x"});
// Will automatically read the PINECONE_API_KEY and PINECONE_ENVIRONMENT env vars
export const pineconeIndex = pinecone.Index("players-ingestion");

export const vectorStore = await PineconeStore.fromExistingIndex(
  embeddings,
  {
    pineconeIndex,
    maxConcurrency: 5,
  }
);