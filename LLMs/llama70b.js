import { ChatGroq } from "@langchain/groq"
import "dotenv/config"; 

export const llama70b = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})