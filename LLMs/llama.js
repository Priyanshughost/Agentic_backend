import { ChatGroq } from "@langchain/groq"
import "dotenv/config"; 

export const llama = new ChatGroq({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})