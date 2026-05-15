import { embeddings } from "../../utils/embeddings.js";
import { pineconeIndex } from "../../utils/pinecone.js";

export async function retrievalNode(state) {

    // 1. BUILD FINAL SEMANTIC QUERY
    // Combines accumulated retrieval memory + latest retrieval fragment

    const semanticQuery = (state.semanticMemory || "").trim();

    // console.log("\n🧠 Semantic Retrieval Query:");
    // console.log(semanticQuery);

    // 2. EMBEDDING GENERATION

    const queryEmbedding = await embeddings.embedQuery(
        semanticQuery,
        {
            taskType: "RETRIEVAL_QUERY",
        }
    );

    // 3. BUILD FILTER

    const filter =
        state.pineconeFilter &&
            Object.keys(state.pineconeFilter).length > 0
            ? state.pineconeFilter
            : undefined;

    // console.log("\n🧩 Pinecone Filter:");
    // console.log(JSON.stringify(filter, null, 2));

    // 4. HYBRID PINECONE SEARCH

    const result = await pineconeIndex.query({
        vector: queryEmbedding,

        topK: 20,

        includeMetadata: true,

        filter,
    });

    // console.log(
    //     `\n📦 Retrieval Result:\n${JSON.stringify(result, null, 2)}`
    // );

    // 5. TRANSFORM RESULTS

    const candidateScores = {};

    const retrievedCandidates =
        (result.matches || []).map((match) => {

            const name =
                match.metadata?.name || "Unknown";

            candidateScores[name] =
                match.score;

            return {
                id: match.id,

                score: match.score,

                metadata: {
                    ...match.metadata,
                },
            };
        });

    // 6. OPTIONAL DEBUG RANKING

    console.log("\n🏏 Top Candidates:");

    retrievedCandidates.forEach((candidate, index) => {

        console.log(
            `${index + 1}. ${candidate.metadata.name} (${candidate.score})`
        );
    });

    // 7. RETURN UPDATED STATE

    return {

        retrievedCandidates,

        // candidateScores: {
        //     ...(state.candidateScores || {}),
        //     ...newCandidateScores,
        // },
    };
}