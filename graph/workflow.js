import {
    StateGraph,
    END
} from "@langchain/langgraph";

import { IPLState }
    from "./state.js";

import { bootstrapNode }
    from "./nodes/bootstrapNode.js";

import { interpreterNode }
    from "./nodes/interpreterNode.js";

import { retrievalNode }
    from "./nodes/retrievalNode.js";

import { confidenceNode }
    from "./nodes/confidenceNode.js";

import { questionNode }
    from "./nodes/questionNode.js";

import { guessNode }
    from "./nodes/guessNode.js";

const workflow =
    new StateGraph(IPLState)

        // NODES
        .addNode(
            "bootstrapNode",
            bootstrapNode
        )

        .addNode(
            "interpreterNode",
            interpreterNode
        )

        .addNode(
            "retrievalNode",
            retrievalNode
        )

        .addNode(
            "confidenceNode",
            confidenceNode
        )

        .addNode(
            "questionNode",
            questionNode
        )

        .addNode(
            "guessNode",
            guessNode
        )

        // ENTRY
        .addConditionalEdges(
            "__start__",

            (state) => {

                return state.latestAnswer
                    ? "interpreterNode"
                    : "bootstrapNode";
            },

            {

                bootstrapNode:
                    "bootstrapNode",

                interpreterNode:
                    "interpreterNode",
            }
        )

        .addEdge(
            "bootstrapNode",
            "__end__"
        )

        .addEdge(
            "interpreterNode",
            "retrievalNode"
        )
        
        .addEdge(
            "retrievalNode",
            "confidenceNode"
        )

        .addConditionalEdges(

            "confidenceNode",

            (state) => {

                return state.shouldGuess
                    ? "guessNode"
                    : "questionNode";
            },

            {

                guessNode:
                    "guessNode",

                questionNode:
                    "questionNode",
            }
        )

        .addEdge(
            "questionNode",
            "__end__"
        )

        .addEdge(
            "guessNode",
            "__end__"
        )

export const graph =
    workflow.compile();
