import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import "dotenv/config"

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-2",
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  apiKey: "AIzaSyCKqZ7qK85pKKfvU8zOdXeYJrLsZbGL9J4"
});