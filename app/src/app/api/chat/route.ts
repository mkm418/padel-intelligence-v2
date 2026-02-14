/**
 * POST /api/chat
 *
 * RAG-powered padel chatbot endpoint.
 * Flow: User question → Retrieve relevant docs → Build prompt → Stream from OpenRouter
 */

import { NextRequest } from "next/server";
import { retrieveDocuments } from "@/lib/rag";
import { buildPromptWithContext } from "@/lib/system-prompt";
import { chatCompletionStream } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
      });
    }

    // Step 1: Retrieve relevant knowledge base documents
    const relevantDocs = await retrieveDocuments(message, 3);

    // Step 2: Build the prompt with context
    const contextDocs = relevantDocs.map((doc) => ({
      title: doc.title,
      category: doc.category,
      content: doc.content,
      difficulty: doc.difficulty,
    }));

    const messages = buildPromptWithContext(message, contextDocs);

    // Step 3: Inject conversation history (last 10 turns max)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      // Insert history between system prompt and current user message
      const systemMsg = messages[0];
      const userMsg = messages[messages.length - 1];
      messages.length = 0;
      messages.push(systemMsg, ...recentHistory, userMsg);
    }

    // Step 4: Stream response from OpenRouter
    const stream = chatCompletionStream(messages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Chat API Error]", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 }
    );
  }
}
