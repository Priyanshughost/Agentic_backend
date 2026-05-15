import { ChatGroq } from "@langchain/groq"
import "dotenv/config"; 

export const llama8b = new ChatGroq({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})