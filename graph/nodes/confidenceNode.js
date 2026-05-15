import { ChatPromptTemplate } from "@langchain/core/prompts";
import { llama70b } from "../../LLMs/llama70b.js";

const confidencePrompt = ChatPromptTemplate.fromTemplate(`
You are an IPL Akinator Confidence Evaluator.

Your task is to decide whether the system should GUESS the player now
or continue asking more questions.

━━━━━━━━━━━━━━━━━━━━
DECISION FACTORS
━━━━━━━━━━━━━━━━━━━━

You must evaluate:

1. Similarity score dominance
2. Gap between top candidates
3. Retrieval ambiguity
4. Number of questions already asked
5. Semantic consistency of the top players

━━━━━━━━━━━━━━━━━━━━
GUESS RULES
━━━━━━━━━━━━━━━━━━━━

ALWAYS GUESS if:
- 8 questions have already been asked

LIKELY GUESS if:
- top candidate is clearly ahead
- candidate profile strongly matches accumulated semantics
- ambiguity is low

DO NOT GUESS if:
- many candidates have very similar scores
- ambiguity remains high
- top candidates represent different player archetypes

━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━

Return your response in this format:
DECISION: <GUESS or CONTINUE>

━━━━━━━━━━━━━━━━━━━━
CURRENT STATE
━━━━━━━━━━━━━━━━━━━━

Questions Asked:
{questionCount}

Semantic Memory:
{semanticMemory}

Top Candidates:
{candidates}
`);

export async function confidenceNode(state) {

    const topCandidates =
        state.retrievedCandidates
            .map((candidate, index) => {

                return `
                    ${index + 1}.
                    Name: ${candidate.metadata?.name}
                    Role: ${candidate.metadata?.role}
                    Nationality: ${candidate.metadata?.nationality}
                    Score: ${candidate.score}
                `;
            })
            .join("\n");

    const chain =
        confidencePrompt.pipe(llama70b);

    const response =
        await chain.invoke({

            questionCount:
                state.previousAnswers.length,

            semanticMemory:
                state.semanticMemory,

            candidates:
                topCandidates,
        });

    const content = response.content.trim();
    const decision = content.includes("GUESS") ? "GUESS" : "CONTINUE";

    console.log(
        "\n🎯 Confidence Decision:"
    );

    console.log(decision);

    return {

        shouldGuess:
            decision === "GUESS",

        // confidence:
        //     parsed.confidence || 0,
    };
}