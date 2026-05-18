import {
    ChatPromptTemplate
} from "@langchain/core/prompts";

import { llama }
    from "../../LLMs/llama.js";

const questionPrompt = ChatPromptTemplate.fromTemplate(`
You are an IPL Identity Deduction Strategist.

Your task is to generate the SINGLE BEST next question
to identify an IPL cricketer.

━━━━━━━━━━━━━━━━━━━━
CURRENT TOP CANDIDATES
━━━━━━━━━━━━━━━━━━━━

The following are the CURRENT remaining candidate players
after all previous filtering and semantic retrieval.

Use their metadata distribution to decide the BEST next question.

IMPORTANT:
- If almost all remaining candidates are bowlers,
  DO NOT ask batting-related questions.
- If almost all candidates are non-wicketkeepers,
  DO NOT ask wicketkeeper questions.
- Ask questions that SPLIT the remaining candidates efficiently.

{candidateStats}

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
QUESTION MEMORY CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━

You MUST analyze ALL previous questions carefully.

A question is INVALID if it:
- repeats the same cricket concept
- rephrases a previously asked discriminator
- asks about an already resolved attribute
- asks a semantically equivalent question

Examples of INVALID repetitions:

PREVIOUS:
Has the player won the Purple Cap?

INVALID FOLLOWUPS:
- Is the player a Purple Cap winner?
- Has the player been the highest wicket taker in an IPL season?
- Is the player known for winning bowling awards?
- Has the player topped IPL bowling charts?

PREVIOUS:
Is the player an overseas cricketer?

INVALID FOLLOWUPS:
- Is the player an international overseas professional?
- Is the player foreign?
- Is the player from outside India?

PREVIOUS:
Is the player known more for spin bowling?

INVALID FOLLOWUPS:
- Is the player a spinner?
- Does the player bowl spin?
- Is spin bowling the player's primary skill?

Each new question MUST introduce a COMPLETELY NEW discriminator dimension.

Before generating the next question:

1. Analyze ALL previously asked discriminator concepts.
2. Identify which cricket attributes are already resolved.
3. Eliminate those dimensions entirely from future questioning.
4. Generate a question from a NEW unexplored discriminator dimension.

Questions should behave like a decision tree.

Every new question must partition the remaining player space using a NEW unresolved attribute.
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

Questions MUST remain logically consistent with previously inferred player constraints.

- Look at CURRENT TOP CANDIDATES METADATA. If 100% of the remaining top candidates have "wicketkeeper": false or "role": "Bowler", asking "Is the player a wicketkeeper?" is an INVALID question because it cannot split the remaining space.
- Look at PREVIOUS ANSWERS. If the user stated the player is NOT a batsman, do not ask about batting features (finisher, anchor, wicketkeeper).
- Prioritize questions that split the CURRENT TOP CANDIDATES down the middle (e.g., if half are Spinners and half are Pace bowlers, ask: "Is the player known more for spin bowling?").

Return ONLY ONE short question. No conversational text, no pleasantries.

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
PREVIOUS ANSWERS
━━━━━━━━━━━━━━━━━━━━

{previousAnswers}

━━━━━━━━━━━━━━━━━━━━
ACTIVE STRUCTURED FILTERS
━━━━━━━━━━━━━━━━━━━━

{pineconeFilter}

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

function buildCandidateStats(candidates = []) {

    const stats = {};

    for (const candidate of candidates) {

        const metadata = candidate.metadata || {};

        for (const key in metadata) {

            const value = metadata[key];

            if (
                value === undefined ||
                value === null
            ) continue;

            if (!stats[key]) {
                stats[key] = {};
            }

            const normalizedValue =
                String(value);

            stats[key][normalizedValue] =
                (stats[key][normalizedValue] || 0) + 1;
        }
    }

    return stats;
}

export async function questionNode(state) {

    const chain =
        questionPrompt.pipe(llama);

    const candidateStats =
        buildCandidateStats(
            (state.retrievedCandidates || [])
                .slice(0, 15)
        );

    const response = await chain.invoke({
        // Properly joining and passing state variables
        previousQuestions: (state.previousQuestions || []).join("\n"),
        previousAnswers: (state.previousAnswers || []).join("\n"),
        pineconeFilter: JSON.stringify(state.pineconeFilter || {}, null, 2),
        semanticMemory: state.semanticMemory || "",
        candidateStats:
            JSON.stringify(
                candidateStats,
                null,
                2
            ),
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
