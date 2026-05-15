import "dotenv/config";

import fs from "fs/promises";

import pLimit from "p-limit";

import { ChatGroq } from "@langchain/groq";

import {
    TavilySearchAPIRetriever
} from "@langchain/community/retrievers/tavily_search_api";



/* =========================================================
   FILES
========================================================= */

const INPUT_FILE =
    "./data/ipl_players_semantic_rag.json";

const OUTPUT_FILE =
    "./data/ipl_players_ultra_semantic.json";



/* =========================================================
   CONCURRENCY
========================================================= */

const limit = pLimit(1);



/* =========================================================
   GROQ KEYS
========================================================= */

const GROQ_KEYS = [

    process.env.GROQ_API_KEY_1,

    process.env.GROQ_API_KEY_2,
];



const GROQ_KEY_COOLDOWNS = {};



/* =========================================================
   MODELS
========================================================= */

const MODEL_POOL = [

    "llama-3.3-70b-versatile",

    "meta-llama/llama-4-scout-17b-16e-instruct",

    "openai/gpt-oss-120b",

    "llama-3.1-8b-instant",

    "openai/gpt-oss-20b",
];



const MODEL_DELAYS = {

    "llama-3.3-70b-versatile": 3500,

    "meta-llama/llama-4-scout-17b-16e-instruct": 1800,

    "openai/gpt-oss-120b": 2500,

    "llama-3.1-8b-instant": 1200,

    "openai/gpt-oss-20b": 1200,
};



const MODEL_COOLDOWNS = {};



/* =========================================================
   TAVILY
========================================================= */

const TAVILY_KEYS = [
    process.env.TAVILY_API_KEY_2,

    process.env.TAVILY_API_KEY_1,

];



const TAVILY_COOLDOWNS = {};



/* =========================================================
   UTILITIES
========================================================= */

function sleep(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}



function randomDelay(min, max) {

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}



function clean(text) {

    if (!text) return "";

    return text
        .replace(/```/g, "")
        .replace(/^text/i, "")
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim();
}



function isRateLimitError(err) {

    const msg =
        err?.message?.toLowerCase() || "";

    return (

        msg.includes("429") ||

        msg.includes("rate") ||

        msg.includes("limit") ||

        msg.includes("too many requests")
    );
}



/* =========================================================
   FALLBACK SEMANTIC
========================================================= */

function buildFallbackSemantic(player) {

    const m =
        player.metadata;

    return `
${m.name} is a ${m.nationality} cricketer associated with ${m.team} in the Indian Premier League. Primarily known for contributions as a ${m.role}, the player has participated in franchise-based T20 cricket and remains connected with IPL squad structures, professional cricket environments, and franchise team combinations within modern Indian Premier League cricket.
`
        .replace(/\s+/g, " ")
        .trim();
}



/* =========================================================
   LOAD EXISTING OUTPUT
========================================================= */

async function loadExistingOutput() {

    try {

        const raw =
            await fs.readFile(
                OUTPUT_FILE,
                "utf-8"
            );

        const parsed =
            JSON.parse(raw);

        console.log(
            `Resuming existing output (${parsed.length} players)`
        );

        return parsed;

    } catch {

        return [];
    }
}



/* =========================================================
   SAVE OUTPUT
========================================================= */

async function saveOutput(data) {

    await fs.writeFile(

        OUTPUT_FILE,

        JSON.stringify(
            data,
            null,
            2
        ),

        "utf-8"
    );
}



/* =========================================================
   TAVILY SEARCH
========================================================= */

async function tavilySearch(query) {

    for (
        let i = 0;
        i < TAVILY_KEYS.length;
        i++
    ) {

        if (

            TAVILY_COOLDOWNS[i] &&

            Date.now() <
            TAVILY_COOLDOWNS[i]
        ) {

            continue;
        }

        try {

            console.log(
                `Tavily Search using Key ${i + 1}`
            );



            const retriever =
                new TavilySearchAPIRetriever({

                    k: 5,

                    apiKey:
                        TAVILY_KEYS[i],
                });



            const docs =
                await retriever.invoke(
                    query
                );



            return docs;

        } catch (err) {

            console.log(
                `Tavily Key ${i + 1} failed`
            );

            console.log(
                err.message
            );



            if (
                isRateLimitError(err)
            ) {

                TAVILY_COOLDOWNS[i] =
                    Date.now() + 60000;
            }



            await sleep(
                randomDelay(3000, 7000)
            );
        }
    }

    return [];
}



/* =========================================================
   QUERY PLANNER
========================================================= */

async function generateSearchQueries(player) {

    const m =
        player.metadata;



    const plannerPrompt = `

You are an elite cricket retrieval planner.

Generate highly targeted web search queries
for retrieving the MOST recognizable
information about an IPL player.

PRIORITIZE:
- IPL trophies
- Orange Cap
- Purple Cap
- captaincy
- iconic performances
- records
- nationality significance
- franchise legacy
- famous moments
- comeback stories
- public cricket identity
- unique cricket traits

DO NOT mainly focus on playing style.

Generate 5 search queries.

OUTPUT RULES:
- ONLY queries
- One query per line
- No numbering
- No markdown

PLAYER:

Name: ${m.name}

Nationality: ${m.nationality}

Role: ${m.role}

Team: ${m.team}

Captain: ${m.captain}

Wicketkeeper: ${m.wicketkeeper}

Big Hitter: ${m.bigHitter}

Death Bowler: ${m.deathBowler}

Played T20I: ${m.hasPlayedT20I}

Price Tier: ${m.priceTier}
`;



    for (
        let keyIndex = 0;
        keyIndex < GROQ_KEYS.length;
        keyIndex++
    ) {

        if (

            GROQ_KEY_COOLDOWNS[keyIndex] &&

            Date.now() <
            GROQ_KEY_COOLDOWNS[keyIndex]
        ) {

            continue;
        }

        try {

            const llm =
                new ChatGroq({

                    apiKey:
                        GROQ_KEYS[keyIndex],

                    model:
                        "llama-3.1-8b-instant",

                    temperature: 0.7,

                    maxTokens: 200,
                });



            const response =
                await llm.invoke([

                    {
                        role: "system",

                        content:
                            "You are a cricket search query planning engine."
                    },

                    {
                        role: "user",

                        content:
                            plannerPrompt
                    }
                ]);



            const queries =
                response.content

                    .split("\n")

                    .map(q => q.trim())

                    .filter(Boolean)

                    .slice(0, 5);



            return queries;

        } catch (err) {

            console.log(
                `Query planner failed on key ${keyIndex + 1}`
            );



            if (
                isRateLimitError(err)
            ) {

                GROQ_KEY_COOLDOWNS[keyIndex] =
                    Date.now() + 60000;
            }



            await sleep(
                randomDelay(3000, 7000)
            );
        }
    }



    return [

        `${m.name} IPL achievements`,

        `${m.name} IPL trophies`,

        `${m.name} cricket records`,
    ];
}



/* =========================================================
   WEB CONTEXT
========================================================= */

async function fetchPlayerWebContext(player) {

    const queries =
        await generateSearchQueries(
            player
        );



    console.log(
        `Queries for ${player.metadata.name}:`
    );



    let combinedContext = "";



    for (const query of queries) {

        try {

            const docs =
                await tavilySearch(query);



            const text =
                docs

                    .map(doc => doc.pageContent)

                    .join("\n\n");



            combinedContext +=
                "\n\n" + text;



            await sleep(
                randomDelay(1000, 2500)
            );

        } catch (err) {

            console.log(
                `Search failed: ${query}`
            );
        }
    }



    return combinedContext
        .slice(0, 12000);
}



/* =========================================================
   PROMPT
========================================================= */

function buildPrompt(player, webContext) {

    const m =
        player.metadata;

    return `

You are an elite IPL semantic intelligence engine.

Generate a deeply recognizable cricket identity profile.

The profile MUST identify the player uniquely.

=========================================================
BASE PLAYER DATA
=========================================================

Name: ${m.name}

Nationality: ${m.nationality}

Team: ${m.team}

Role: ${m.role}

Batting Hand: ${m.battingHand}

Overseas: ${m.overseas}

Wicketkeeper: ${m.wicketkeeper}

Captain: ${m.captain}

Aggressive Batter: ${m.aggressiveBatter}

Anchor Batter: ${m.anchorBatter}

Big Hitter: ${m.bigHitter}

Death Bowler: ${m.deathBowler}

Played T20I: ${m.hasPlayedT20I}

Left Handed: ${m.leftHanded}

Bowls Spin: ${m.bowlsSpin}

Bowls Pace: ${m.bowlsPace}

Price Tier: ${m.priceTier}



=========================================================
WEB RETRIEVAL CONTEXT
=========================================================

${webContext}



=========================================================
PRIMARY OBJECTIVE
=========================================================

The profile should answer:

"Who is this player in cricket history?"

NOT:

"How does this player play?"



=========================================================
HIGH PRIORITY SIGNALS
=========================================================

Strongly prioritize:

- IPL trophies
- Orange Cap
- Purple Cap
- captaincy achievements
- nationality identity
- franchise legacy
- iconic cricket moments
- unique cricket traits
- famous records
- public reputation
- comeback stories
- tournament achievements
- historical significance
- famous partnerships
- national team importance



=========================================================
IMPORTANT
=========================================================

DO NOT hallucinate achievements.

If uncertain:
avoid claim.

Avoid dramatic language.

Avoid motivational filler.

Tone should resemble:
Wikipedia + Cricbuzz profile.

Avoid repetitive phrases.

Every player must feel:
- historically distinct
- culturally recognizable
- semantically unique



=========================================================
OUTPUT STYLE
=========================================================

- biography-like
- achievement-heavy
- identity-rich
- retrieval optimized
- highly semantic
- naturally written
- information dense

Length:
220-420 words.

OUTPUT RULES:
- ONLY final semantic profile
- NO markdown
- NO bullet points
- NO explanations
`;
}



/* =========================================================
   SEMANTIC GENERATION
========================================================= */

async function generateSemanticDescription(

    player,

    model,

    webContext
) {

    for (
        let keyIndex = 0;
        keyIndex < GROQ_KEYS.length;
        keyIndex++
    ) {

        if (

            GROQ_KEY_COOLDOWNS[keyIndex] &&

            Date.now() <
            GROQ_KEY_COOLDOWNS[keyIndex]
        ) {

            continue;
        }

        try {

            console.log(
                `Using Groq Key ${keyIndex + 1} with ${model}`
            );



            const llm =
                new ChatGroq({

                    apiKey:
                        GROQ_KEYS[keyIndex],

                    model,

                    temperature: 0.72,

                    maxTokens: 1400,

                    maxRetries: 0,
                });



            const prompt =
                buildPrompt(
                    player,
                    webContext
                );



            /*
            FIRST GENERATION
            */

            let response =
                await llm.invoke([

                    {
                        role: "system",

                        content:
                            "You are a world-class cricket semantic profiling model."
                    },

                    {
                        role: "user",

                        content:
                            prompt
                    }
                ]);



            let content =
                clean(response.content);



            /*
            TRUNCATION DETECTION
            */

            const looksTruncated = (

                !content ||

                content.length < 150 ||

                !/[.!?]$/.test(
                    content.trim()
                ) ||

                content.endsWith(",")

            );



            /*
            CONTINUATION PASS
            */

            if (looksTruncated) {

                console.log(
                    `Continuation generation for ${player.metadata.name}`
                );



                try {

                    const continuation =
                        await llm.invoke([

                            {
                                role: "system",

                                content:
                                    "Continue the cricket profile naturally from where it stopped. Finish the response properly. Do not restart."
                            },

                            {
                                role: "user",

                                content:
                                    content
                            }
                        ]);



                    content +=
                        "\n\n" +

                        clean(
                            continuation.content
                        );



                } catch (err) {

                    console.log(
                        `Continuation failed for ${player.metadata.name}`
                    );
                }
            }



            /*
            HARD CLEANUP
            */

            content =
                content

                    .replace(/[,:;]\s*$/, ".")

                    .replace(/\s+/g, " ")

                    .trim();



            /*
            ENSURE ENDING
            */

            if (
                !/[.!?]$/.test(content)
            ) {

                content += ".";
            }



            /*
            TOO SHORT
            */

            if (
                !content ||
                content.length < 120
            ) {

                return buildFallbackSemantic(
                    player
                );
            }



            return content;

        } catch (err) {

            console.log(
                `Groq Key ${keyIndex + 1} failed with ${model}`
            );

            console.log(
                err.message
            );



            if (
                isRateLimitError(err)
            ) {

                GROQ_KEY_COOLDOWNS[keyIndex] =
                    Date.now() + 60000;
            }



            await sleep(
                randomDelay(4000, 9000)
            );
        }
    }



    return buildFallbackSemantic(
        player
    );
}



/* =========================================================
   ROBUST GENERATION
========================================================= */

async function robustGeneration(

    player,

    index
) {

    for (
        let attempt = 0;
        attempt < MODEL_POOL.length;
        attempt++
    ) {

        const model =
            MODEL_POOL[
            (index + attempt) %
            MODEL_POOL.length
            ];



        if (

            MODEL_COOLDOWNS[model] &&

            Date.now() <
            MODEL_COOLDOWNS[model]
        ) {

            continue;
        }

        try {

            console.log(
                `Generating ${player.metadata.name} using ${model}`
            );



            const webContext =
                await fetchPlayerWebContext(
                    player
                );



            const semantic =
                await generateSemanticDescription(

                    player,

                    model,

                    webContext
                );



            await sleep(

                (MODEL_DELAYS[model] || 2000)

                +

                randomDelay(1000, 3000)
            );



            return semantic;

        } catch (err) {

            console.log(
                `FAILED ${player.metadata.name} -> ${model}`
            );



            if (
                isRateLimitError(err)
            ) {

                MODEL_COOLDOWNS[model] =
                    Date.now() + 60000;
            }



            await sleep(
                randomDelay(5000, 12000)
            );
        }
    }



    return buildFallbackSemantic(
        player
    );
}



/* =========================================================
   MAIN
========================================================= */

async function main() {

    console.log(
        "Reading dataset..."
    );



    const raw =
        await fs.readFile(
            INPUT_FILE,
            "utf-8"
        );



    const players =
        JSON.parse(raw);



    const existing =
        await loadExistingOutput();



    /*
    KEEP ONLY GOOD OUTPUTS
    */

    const finalOutput =
        existing.filter(player => {

            const content =
                player.pageContent;

            return (

                content &&

                typeof content === "string" &&

                content.trim() !== "" &&

                content.trim().length >= 250 &&

                /[.!?]$/.test(
                    content.trim()
                )
            );
        });



    /*
    REPROCESS:
    - empty
    - short
    - truncated
    */

    const remainingPlayers =
        players.filter(player => {

            const existingPlayer =
                existing.find(
                    p => p.id === player.id
                );



            if (!existingPlayer) {
                return true;
            }



            const content =
                existingPlayer.pageContent;



            if (

                !content ||

                typeof content !== "string" ||

                content.trim() === "" ||

                content.trim().length < 250 ||

                !/[.!?]$/.test(
                    content.trim()
                )
            ) {

                console.log(
                    `Reprocessing -> ${player.metadata.name}`
                );

                return true;
            }



            return false;
        });



    console.log(
        `Total Players: ${players.length}`
    );

    console.log(
        `Remaining Players: ${remainingPlayers.length}`
    );



    let processedCount = 0;



    await Promise.all(

        remainingPlayers.map(

            (player, index) =>

                limit(async () => {

                    try {

                        const semantic =
                            await robustGeneration(

                                player,

                                index
                            );



                        const updated = {

                            ...player,

                            pageContent:
                                semantic
                        };



                        finalOutput.push(
                            updated
                        );



                        processedCount++;



                        console.log(
                            `DONE ${processedCount}/${remainingPlayers.length}`
                        );



                        await saveOutput(
                            finalOutput
                        );

                    } catch (err) {

                        console.log(
                            `FINAL FAILURE ${player.metadata.name}`
                        );



                        const updated = {

                            ...player,

                            pageContent:
                                buildFallbackSemantic(
                                    player
                                )
                        };



                        finalOutput.push(
                            updated
                        );



                        await saveOutput(
                            finalOutput
                        );
                    }
                })
        )
    );



    console.log(
        "ALL PLAYERS COMPLETED"
    );

    console.log(
        `Saved -> ${OUTPUT_FILE}`
    );
}



/* =========================================================
   START
========================================================= */

main().catch(console.error);