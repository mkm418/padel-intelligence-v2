/**
 * OpenRouter API client
 *
 * Uses the OpenAI-compatible chat completions endpoint.
 * Free models: append `:free` to model name, or use "openrouter/auto" for auto-selection.
 *
 * Docs: https://openrouter.ai/docs/quickstart
 */

// Free models that work well for a knowledge-grounded chatbot
export const FREE_MODELS = {
  // Auto-select best available free model
  auto: "openrouter/auto",
  // Good general-purpose free options (as of Feb 2026)
  gemini: "google/gemini-2.0-flash-exp:free",
  llama: "meta-llama/llama-3.3-70b-instruct:free",
  qwen: "qwen/qwen-2.5-72b-instruct:free",
  deepseek: "deepseek/deepseek-chat-v3-0324:free",
} as const;

// Cheap paid models — more reliable than free tier
export const CHEAP_MODELS = {
  geminiFlash: "google/gemini-2.0-flash-001", // $0.10/M in, $0.40/M out
  deepseek: "deepseek/deepseek-chat",          // $0.14/M in, $0.28/M out
} as const;

// Default model — Gemini Flash: fast, cheap ($0.10/M), reliable
const DEFAULT_MODEL = CHEAP_MODELS.geminiFlash;

interface ChatMessage {
  role: string;
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Send a chat completion request to OpenRouter
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }
): Promise<{ content: string; model: string; usage?: OpenRouterResponse["usage"] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY not set. Get a free key at https://openrouter.ai/keys"
    );
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://padel-intelligence.com", // for OpenRouter analytics
      "X-Title": "Padel Coach AI", // shows in OpenRouter dashboard
    },
    body: JSON.stringify({
      model: options?.model || DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      // Reduce hallucination — stay grounded in context
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${error}`);
  }

  const data: OpenRouterResponse = await response.json();

  return {
    content: data.choices[0]?.message?.content || "No response generated.",
    model: data.model,
    usage: data.usage,
  };
}

/**
 * Stream a chat completion from OpenRouter
 * Returns a ReadableStream for the Next.js response
 */
export function chatCompletionStream(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): ReadableStream {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not set");
  }

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://padel-intelligence.com",
              "X-Title": "Padel Coach AI",
            },
            body: JSON.stringify({
              model: options?.model || DEFAULT_MODEL,
              messages,
              temperature: options?.temperature ?? 0.7,
              max_tokens: options?.maxTokens ?? 2048,
              top_p: 0.9,
              stream: true,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error })}\n\n`)
          );
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ content })}\n\n`
                  )
                );
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: String(err) })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}
