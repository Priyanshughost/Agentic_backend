import { ChatGoogle } from "@langchain/google";
import "dotenv/config";

export const gemini = new ChatGoogle({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-2.5-pro",
    temperature: 0,
    maxRetries: 2
});