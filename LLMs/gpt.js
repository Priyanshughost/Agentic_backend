import { ChatGroq } from "@langchain/groq"
import "dotenv/config"; 

export const gpt = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})