import { ChatGroq } from "@langchain/groq"
import "dotenv/config"; 

export const gpt20b = new ChatGroq({
    model: "openai/gpt-oss-safeguard-20b",
    temperature: 0,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})