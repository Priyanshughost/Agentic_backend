import {
    ChatPromptTemplate
} from "@langchain/core/prompts";

import { llama }
    from "../../LLMs/llama.js";

// 1. Extract values of the selected dimension from current candidates
// This allows the LLM to see: "Okay, I should ask about CSK because 50% of candidates are CSK"
// const candidateValues = state.retrievedCandidates.map(c =>
//     c.metadata[state.selectedDimension]
// ).filter(v => v !== null && v !== undefined);

const questionPrompt = ChatPromptTemplate.fromTemplate(`
You are an IPL Identity Deduction Strategist.

Your task is to generate the SINGLE BEST next question
to identify an IPL cricketer.

━━━━━━━━━━━━━━━━━━━━
CORE OBJECTIVE
━━━━━━━━━━━━━━━━━━━━

The next question should:

- maximize identity separation
- reduce semantic ambiguity
- narrow the player universe
- exploit IPL legacy traits
- target historically distinctive signals
- avoid repetitive attribute questioning

━━━━━━━━━━━━━━━━━━━━
PLAYER DATASET CHARACTERISTICS
━━━━━━━━━━━━━━━━━━━━

{{
    "id": "firstname_surname",
    "pageContent": "semantic text goes here",
    "metadata": {{
      "name": "firstname surname",
      "nationality":"IND",
      "team": "CSK",
      "role": "Batter",
      "battingHand": "Right",
      "bowlingStyle": null,
      "overseas": false,
      "wicketkeeper": false,
      "captain": false,
      "aggressiveBatter": false,
      "anchorBatter": true,
      "bigHitter": true,
      "deathBowler": false,
      "hasPlayedT20I": true,
      "leftHanded": false,
      "bowlsSpin": false,
      "bowlsPace": false,
      "priceTier": "Premium (4-10cr)"
    }}
}}

Team = Short Form
Chennai Super Kings	= CSK
Mumbai Indians = MI
Royal Challengers Bengaluru	= RCB
Kolkata Knight Riders = KKR
Sunrisers Hyderabad	= SRH
Delhi Capitals = DC
Rajasthan Royals = RR
Punjab Kings = PBKS
Lucknow Super Giants = LSG
Gujarat Titans = GT

The player database contains rich semantic cricket identities including:

- IPL achievements
- captaincy
- Orange Cap / Purple Cap
- cult hero reputation
- comeback stories
- franchise legacy
- iconic moments
- aggressive batting
- death bowling
- spin/pace specialization
- wicketkeeping
- opening batter identity
- finisher identity
- national team importance
- T20 specialist reputation
- leadership aura
- clutch performances
- famous records
- historical significance

━━━━━━━━━━━━━━━━━━━━
QUESTION STRATEGY
━━━━━━━━━━━━━━━━━━━━

Prefer questions that:
- split the player space efficiently
- target distinctive cricket identity
- reveal unique IPL legacy traits
- improve semantic retrieval quality

GOOD QUESTION TYPES:
- captaincy
- franchise icon status
- international importance
- Orange/Purple Cap
- aggressive vs anchor style
- pace vs spin
- death overs specialization
- wicketkeeper role
- finisher identity
- IPL title legacy
- overseas identity
- cult hero reputation

━━━━━━━━━━━━━━━━━━━━
IMPORTANT RULES
━━━━━━━━━━━━━━━━━━━━

DO NOT:
- mention player names
- reference retrieved candidates
- ask repeated questions
- ask vague questions
- ask compound questions
- ask numerical trivia
- ask year-specific statistical questions

Avoid weak generic questions unless necessary.

━━━━━━━━━━━━━━━━━━━━
PREVIOUS QUESTIONS
━━━━━━━━━━━━━━━━━━━━

{previousQuestions}

━━━━━━━━━━━━━━━━━━━━
SEMANTIC MEMORY
━━━━━━━━━━━━━━━━━━━━

{semanticMemory}

━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━

Return ONLY ONE short question.

EXAMPLES OF STRONG QUESTIONS:
- Has the player captained an IPL franchise?
- Is the player known as a death overs specialist?
- Has the player won the Orange Cap?
- Is the player primarily recognized for aggressive batting?
- Is the player considered a franchise icon?
- Is the player an overseas cricketer?
- Is the player known more for spin bowling?
- Is the player recognized as a finisher?
- Has the player produced iconic IPL playoff performances?
- Is the player from (any IPL) team
- Is the player from XYZ country
`);

//     const prompt = ChatPromptTemplate.fromTemplate(`
// You are an IPL Question Strategist.
// Generate ONE clear YES/NO/MAYBE question to split the current candidate pool.

// DIMENSION: {dimension}
// CANDIDATE VALUES FOR THIS DIMENSION: {values}
// ALREADY ASKED: {previousQuestions}

// GUIDELINES:
// 1. TARGETED: Use the [CANDIDATE VALUES] to pick a specific target. (e.g., If the dimension is 'team' and many players are 'CSK', ask about CSK).
// 2. TERMINOLOGY: Use the dataset's specific terms:
//    - For 'priceTier': Use "Marquee (≥10cr)", "Premium", or "Budget".
//    - For 'hasPlayedT20I': Use "capped international player".
//    - For 'bigHitter': Use "known for long-range power hitting".
// 3. NO SUBJECTIVITY: Ask about facts, not "Is he good?".
// 4. FORMAT: Return ONLY the question string.

// Question:`);
export async function questionNode(state) {

    const chain =
        questionPrompt.pipe(llama);

    const response =
        await chain.invoke({

            previousQuestions:
                (state.previousQuestions || [])
                    .join("\n"),

            semanticMemory:
                state.semanticMemory || "",
        });

    const question =
        String(response.content).trim();

    console.log(
        "\n❓ Next Question:",
        question
    );

    return {

        currentQuestion: question,

        // reducers removed → append manually
        previousQuestions: [
            ...(state.previousQuestions || []),
            question,
        ],
    };
}
