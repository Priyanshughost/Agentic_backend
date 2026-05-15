import { ChatPromptTemplate } from "@langchain/core/prompts";
import { gpt20b } from "../../LLMs/gpt20b.js";

// Note the double curly braces for JSON examples and metadata structures
const prompt = ChatPromptTemplate.fromTemplate(`
You are an IPL Retrieval Query Architect.

Your task is to transform a user's YES/NO/MAYBE answer into:

1. Dense semantic retrieval text optimized for embedding similarity
2. A Pinecone metadata filter

━━━━━━━━━━━━━━━━━━━━
OBJECTIVE
━━━━━━━━━━━━━━━━━━━━

The generated semantic text will be embedded and used for vector similarity search against IPL player biographies.

The database contains terms like:
- Indian cricketer
- overseas batter
- opening batter
- pace bowler
- spin bowling all-rounder
- wicketkeeper-batsman
- aggressive batter
- anchor batter
- death overs specialist
- left-arm pacer
- finisher
- franchise player

Generate SHORT retrieval-oriented semantic fragments.

DO NOT:
- write poetic descriptions
- write dramatic commentary
- use conversational text
- explain reasoning

━━━━━━━━━━━━━━━━━━━━
SEMANTIC RULES
━━━━━━━━━━━━━━━━━━━━

1. YES
Generate semantic keywords directly aligned with the attribute.

Example:
Question: Is the player overseas?
Answer: yes

Semantic:
Overseas cricketer International player Foreign T20 professional

2. NO
DO NOT negate the attribute.

Instead generate the CONTRASTING cricket profile.

Example:
Question: Is the player overseas?
Answer: no

BAD:
Not an overseas player

GOOD:
Indian domestic cricketer Indian international player Homegrown IPL talent

Another Example:
Question: Is the player primarily a batter?
Answer: no

GOOD:
Specialist bowler Pace bowler or spin bowling option

3. MAYBE
Generate hybrid or flexible semantic descriptions

Example:
Batting all-rounder Multi-dimensional cricketer Utility player

━━━━━━━━━━━━━━━━━━━━
FILTER RULES
━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━
STRICT METADATA SCHEMA
━━━━━━━━━━━━━━━━━━━━

You may ONLY generate Pinecone filters using these metadata fields:

- nationality
- team
- role
- battingHand
- overseas
- wicketkeeper
- captain
- aggressiveBatter
- anchorBatter
- bigHitter
- deathBowler
- hasPlayedT20I
- leftHanded
- bowlsSpin
- bowlsPace
- priceTier

DO NOT invent metadata fields.

DO NOT generate filters for:
- Orange Cap
- Purple Cap
- cult hero
- finisher
- franchise icon
- playoff hero
- comeback story
- iconic player
- clutch performances
- leadership aura

Those concepts belong ONLY in semanticText.

If a question references concepts not present in metadata,
return an empty filter object:

{{}}

Generate a valid Pinecone metadata filter.

Examples:

Question: Is the player primarily a batter?
Answer: yes

Filter:
{{
  "role": {{
    "$in": ["Batter", "All-rounder", "Wicketkeeper"]
  }}
}}

Question: Is the player primarily a batter?
Answer: no

Filter:
{{
  "role": {{
    "$in": ["Bowler"]
  }}
}}

Question: Is the player overseas?
Answer: yes

Filter:
{{
  "overseas": true
}}

Question: Is the player overseas?
Answer: no

Filter:
{{
  "nationality": "IND"
}}

Question: Is the player from CSK or Chennai Super Kings team?
Answer: no

Filter:
{{
  "team": {{
    "$ne": ["CSK"]
  }}
}}

Answer: yes

Filter:
{{
  "team": "CSK"
}}

━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON.

{{
  "semanticText": "...",
  "filter": {{...}}
}}

Question: {question}
Answer: {answer}
`);

export async function interpreterNode(state) {
    // console.log("\n\nEntering interpreter node\n\n", JSON.stringify(state), "\n\n")
    const chain = prompt.pipe(gpt20b);

    const response = await chain.invoke({
        question: state.currentQuestion,
        answer: state.latestAnswer,
    });

    let parsed;
    try {
        parsed = JSON.parse(response.content);
    } catch (err) {
        console.error("❌ Failed to parse interpreter JSON:", err);
        return {
            previousAnswers: state.latestAnswer,
        };
    }

    const semanticText = parsed.semanticText?.trim() || "";
    const filter = parsed.filter || {};

    console.log("\n🧠 Semantic Query:\n", semanticText);
    console.log("\n🧩 Pinecone Filter:\n", JSON.stringify(filter, null, 2));

    return {

        // append semantic memory manually
        semanticMemory: state.semanticMemory
            ? `${state.semanticMemory}\n${semanticText}`
            : semanticText,

        // append interpreted facts manually
        // interpretedFacts: [
        //     ...(state.interpretedFacts || []),
        //     {
        //         semanticText,
        //         filter,
        //     },
        // ],

        // merge pinecone filters manually
        pineconeFilter: {
            ...(state.pineconeFilter || {}),
            ...filter,
        },

        // append answers manually
        previousAnswers: [
            ...(state.previousAnswers || []),
            state.latestAnswer,
        ],
    };
}