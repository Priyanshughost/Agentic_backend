import fs from "fs-extra";
import { Document }
from "@langchain/core/documents";

const players = await fs.readJson(
  "../backend/data/ipl_players_ultra_semantic.json"
);

export const docs = players.map((player) => {
  return new Document({
    pageContent: player.pageContent,

    metadata: {
      id: player.id,

      ...player.metadata
    }
  });
});

// console.log(
//   `\n✅ Total Documents: ${docs.length}\n`
// );

// console.log(
//   "================ FIRST DOCUMENT ================\n"
// );

// console.log(docs[0]);

// console.log(
//   "\n================ SAMPLE PAGE CONTENT ================\n"
// );

// // console.log(docs[0].pageContent);

// console.log(
//   "\n================ SAMPLE METADATA ================\n"
// );

// // console.log(docs[0].metadata);