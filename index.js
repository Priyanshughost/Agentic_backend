import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { graph } from "./graph/workflow.js";

dotenv.config();

const app = express();

/**
 * Middleware
 */
app.use(
    cors({
        origin: ["http://localhost:5173"], // your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

app.use(express.json())

/**
 * Global Conversation State
 */
let state = {
    latestAnswer: null,
    currentQuestion: null,
    finalGuess: null,
    interpretedFacts: {},
};

/**
 * Health Route
 */
app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: "🏏 IPL Query Architect Running"
    });
})

/**
 * START / CONTINUE ROUTE
 *
 * First request:
 * POST /start
 * body: {}
 *
 * Next requests:
 * POST /start
 * body: { "answer": "yes" }
 */
app.post("/start", async (req, res) => {

    try {

        const answer = req.body?.answer;

        /**
         * FIRST ITERATION
         * No answer yet
         */
        if (answer === undefined || answer === null) {

            console.log("\n🚀 Initializing IPL deduction session...");

            const result = await graph.invoke(state);

            state = {
                ...state,
                ...result
            };

            return res.status(200).json({
                success: true,
                type: "question",
                question: state.currentQuestion,
                state
            });
        }

        /**
         * EXIT HANDLER
         */
        if (String(answer).trim().toLowerCase() === "/bye") {

            return res.status(200).json({
                success: true,
                message: "👋 Session ended"
            });
        }

        /**
         * CONTINUE FLOW
         */
        state.latestAnswer =
            String(answer).trim().toLowerCase();

        console.log("\n⏳ Processing Answer:", state.latestAnswer);

        const updatedResult =
            await graph.invoke(state);

        state = {
            ...state,
            ...updatedResult
        };

        /**
         * FINAL GUESS FOUND
         */
        if (state.finalGuess) {

            console.log("\n🎯 FINAL RESULT FOUND!");
            console.log(state.finalGuess);

            return res.status(200).json({
                success: true,
                type: "final_guess",
                finalGuess: state.finalGuess,
                state
            });
        }

        /**
         * NEXT QUESTION
         */
        return res.status(200).json({
            success: true,
            type: "question",
            question: state.currentQuestion,
            state
        });

    } catch (err) {

        console.error(
            "❌ Graph Execution Error:",
            err
        );

        return res.status(500).json({
            success: false,
            error: "Graph execution failed"
        });
    }
});

/**
 * RESET ROUTE
 */
app.post("/reset", (req, res) => {

    state = {
        latestAnswer: null,
        currentQuestion: null,
        finalGuess: null,
        interpretedFacts: {},
    };

    console.log("\n🔄 State Reset Complete");

    return res.json({
        success: true,
        message: "Conversation reset successful",
        state
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `🚀 Server running on port ${PORT}`
    );
});