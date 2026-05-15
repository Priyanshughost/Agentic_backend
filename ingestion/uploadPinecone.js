import { embeddings }
from "../utils/embeddings.js";

import { pineconeIndex }
from "../utils/pinecone.js";

import { docs }
from "./chunkPlayers.js";

function cleanMetadata(metadata) {
    const cleaned = {};

    for (const key in metadata) {
        const value = metadata[key];

        if (
            value === null ||
            value === undefined
        ) {
            continue;
        }

        if (
            typeof value === "number" &&
            Number.isNaN(value)
        ) {
            continue;
        }

        cleaned[key] = value;
    }

    return cleaned;
}

console.log(
    "📦 Checking existing Pinecone vectors...\n"
);

const existing =
    await pineconeIndex.listPaginated();

const existingIds = new Set(
    existing.vectors?.map((v) => v.id) || []
);

console.log(
    `✅ Found ${existingIds.size} existing vectors\n`
);

for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];

    if (existingIds.has(doc.metadata.id)) {
        console.log(
            `⏭️ Skipping ${doc.metadata.name}`
        );

        continue;
    }

    try {
        console.log(
            `🧠 Embedding ${i + 1}/${docs.length} -> ${
                doc.metadata.name
            }`
        );

        const embedding =
            await embeddings.embedQuery(
                doc.pageContent
            );

        if (
            !embedding ||
            embedding.length !== 3072
        ) {
            console.log(
                `❌ Invalid embedding for ${doc.metadata.name}`
            );

            continue;
        }

        await pineconeIndex.upsert([
            {
                id: doc.metadata.id,

                values: embedding,

                metadata: cleanMetadata({
                    ...doc.metadata,

                    pageContent:
                        doc.pageContent,
                }),
            },
        ]);

        console.log(
            `✅ Uploaded ${doc.metadata.name}`
        );

        await new Promise((resolve) =>
            setTimeout(resolve, 1000)
        );

    } catch (err) {
        console.log(
            `❌ Failed ${doc.metadata.name}`
        );

        console.log(err.message);

        await new Promise((resolve) =>
            setTimeout(resolve, 5000)
        );
    }
}

console.log(
    "\n🎉 Pinecone ingestion complete"
);