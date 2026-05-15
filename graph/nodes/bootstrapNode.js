import {
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
} from "@langchain/core/prompts";

import { groq } from "../../LLMs/groq.js";

const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
        "You are a precise IPL player identification bot. Your output must contain ONLY the question text. Do not include reasoning, explanations, headers, or any extra text. Failure to follow this will break the system."
    ),
    HumanMessagePromptTemplate.fromTemplate(`
Your task: Generate the single BEST opening question for an IPL Akinator system to reduce search space.

GUIDELINES:
- Divide players by role (batting vs bowling), overseas status, or iconic status.
- User can only answer: yes, no, maybe.
- NO franchise-specific references.
- NO reasoning or bullet points.

Return ONLY the question.
    `),
]);

export async function bootstrapNode(state) {
    // Adding a 'stop' sequence or lowering temperature can also help, 
    // but a cleaner prompt usually does the trick.
    const chain = prompt.pipe(groq);

    const response = await chain.invoke({});

    // We still trim just in case of stray whitespace
    const question = response.content.trim();

    return {
        currentQuestion: question,

        // Since reducers are removed,
        // you must manually preserve previous state.
        previousQuestions: [
            ...(state.previousQuestions || []),
            question,
        ],
    };
}


