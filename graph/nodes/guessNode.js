import {
    ChatPromptTemplate
} from "@langchain/core/prompts";

import { gpt }
from "../../LLMs/gpt.js";

const prompt =
    ChatPromptTemplate.fromTemplate(`
You are an IPL final guessing agent.

Your task is to determine the most likely IPL player
based ONLY on:
- semantic memory
- retrieved candidates
- retrieval similarity

IMPORTANT RULES:

1. You MUST choose ONLY from the retrieved candidates.

2. DO NOT hallucinate new player names.

3. Use:
- semantic alignment
- retrieval dominance
- accumulated player facts
to make the best possible final guess.

4. Return ONLY the player name.

Semantic Memory:
{memory}

Retrieved Candidates:
{candidates}
`);

export async function guessNode(
    state
) {
    console.log(`\nEntered Guess node for Inspection\n${JSON.stringify(state, null, 4)}\n\n`)
    const simplifiedCandidates =
        state.retrievedCandidates.map(
            (candidate) => ({
                name:
                    candidate.metadata.name,

                score:
                    candidate.score,

                role:
                    candidate.metadata.role,

                team:
                    candidate.metadata.team,

                overseas:
                    candidate.metadata.overseas,

                wicketkeeper:
                    candidate.metadata.wicketkeeper,

                bowlsSpin:
                    candidate.metadata.bowlsSpin,

                bowlsPace:
                    candidate.metadata.bowlsPace,

                aggressiveBatter:
                    candidate.metadata.aggressiveBatter,

                anchorBatter:
                    candidate.metadata.anchorBatter,

                deathBowler:
                    candidate.metadata.deathBowler,

                captain:
                    candidate.metadata.captain,
            })
        );

    const chain =
        prompt.pipe(gpt);

    const response =
        await chain.invoke({

            memory:
                JSON.stringify(
                    state.semanticMemory,
                    null,
                    2
                ),

            candidates:
                JSON.stringify(
                    simplifiedCandidates,
                    null,
                    2
                ),
        });

    const guessedPlayer =
        response.content.trim();

    console.log(
        "\n🏏 FINAL GUESS:\n"
    );

    console.log(guessedPlayer);

    return {

        finalGuess:
            guessedPlayer,
    };
}

