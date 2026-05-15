import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { graph } from "./graph/workflow.js";
//API keys
// PINECONE_API_KEY = "pcsk_2iJdUy_H1TVFa2uvnEzUJ6d8wYUx1f8YKPr4uWmwPfbFuv5mjeX6rYcr6DaA5psay61t5x";
// PINECONE_INDEX = "players-ingestion";
// PINECONE_ENVIRONMENT = "https://players-ingestion-anigqd9.svc.aped-4627-b74a.pinecone.io";
// GROQ_API_KEY="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"
// GOOGLE_API_KEY="AIzaSyCKqZ7qK85pKKfvU8zOdXeYJrLsZbGL9J4"
async function runIPLGraph() {
    const rl = readline.createInterface({ input, output });

    let state = {
        latestAnswer: null,
        currentQuestion: null,
        finalGuess: null,
        interpretedFacts: {}
    };

    console.log("🏏 --- IPL Query Architect: Session Started ---");
    console.log("(Type '/bye' at any time to exit)\n");

    try {
        let result = await graph.invoke(state);
        state = { ...state, ...result };

        while (!state.finalGuess) {
            
            const question = state.currentQuestion || "Please provide more details:";
            const answer = await rl.question(`🤖 ${question}\n👤 Your Answer: `);

            if (answer.trim().toLowerCase() === "/bye") {
                console.log("\n👋 Shutting down... Goodbye!");
                break;
            }

            state.latestAnswer = answer.trim();

            console.log("⏳ Processing...");

            const updatedResult = await graph.invoke(state);

            state = { ...state, ...updatedResult };

            if (state.interpretedFacts?.semanticText) {
                console.log(`\n[System Info] Semantic Vector: "${state.interpretedFacts.semanticText}"`);
            }
            console.log("-----------------------");
        }

        if (state.finalGuess) {
            console.log("\n🎯 FINAL RESULT FOUND!");
            console.log("================================");
            console.log(state.finalGuess);
            console.log("================================");
        }

    } catch (err) {
        console.error("❌ An error occurred during graph execution:", err);
    } finally {
        rl.close();
    }
}

runIPLGraph();
