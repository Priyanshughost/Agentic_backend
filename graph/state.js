import { Annotation } from "@langchain/langgraph";

export const IPLState = Annotation.Root({

    semanticMemory: Annotation({
        default: () => "",
    }),

    retrievedCandidates: Annotation({
        default: () => [],
    }),

    candidateScores: Annotation({
        default: () => ({}),
    }),

    previousQuestions: Annotation({
        default: () => [],
    }),

    previousAnswers: Annotation({
        default: () => [],
    }),

    interpretedFacts: Annotation({
        default: () => [],
    }),

    currentQuestion: Annotation({
        default: () => "",
    }),

    confidence: Annotation({
        default: () => 0,
    }),

    finalGuess: Annotation({
        default: () => null,
    }),

    ambiguityDimensions: Annotation({
        default: () => [],
    }),

    selectedDimension: Annotation({
        default: () => "",
    }),

    shouldGuess: Annotation({
        default: () => false,
    }),

    latestAnswer: Annotation({
        default: () => "",
    }),

    synthesizedRetrievalQuery: Annotation({
        default: () => "",
    }),

    pineconeFilter: Annotation({
        default: () => ({}),
    }),
});