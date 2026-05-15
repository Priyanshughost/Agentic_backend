import { ChatGroq } from "@langchain/groq"
import "dotenv/config"; 

export const groq = new ChatGroq({
    model: "groq/compound",
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})