import "dotenv/config";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

const pinecone = new PineconeClient({ apiKey: "pcsk_2iJdUy_H1TVFa2uvnEzUJ6d8wYUx1f8YKPr4uWmwPfbFuv5mjeX6rYcr6DaA5psay61t5x" });
// Will automatically read the PINECONE_API_KEY and PINECONE_ENVIRONMENT env vars
const pineconeIndex = pinecone.Index("players-ingestion");

console.log("🗑️ Deleting all vectors...");

await pineconeIndex.deleteAll();

console.log(
    "✅ All Pinecone vectors deleted"
);