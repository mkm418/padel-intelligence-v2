"use client";

/**
 * Padel Coach AI - Chat Interface
 *
 * Clean, fast chat UI with streaming responses.
 * Connects to /api/chat which does RAG retrieval + OpenRouter.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Nav from "@/components/Nav";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Two inline suggestion prompts
const SUGGESTIONS = [
  "How do I hit a bandeja?",
  "Explain the golden point rule",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || input.trim();
      if (!messageText || isLoading) return;

      // Add user message
      const userMessage: Message = { role: "user", content: messageText };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      // Prepare history (previous messages, not including current)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageText, history }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        // Stream the response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let assistantContent = "";
        let buffer = "";

        // Add empty assistant message that we'll update
        setMessages([...updatedMessages, { role: "assistant", content: "" }]);

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
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages([
                  ...updatedMessages,
                  { role: "assistant", content: assistantContent },
                ]);
              }
              if (parsed.error) {
                assistantContent = `Error: ${parsed.error}`;
                setMessages([
                  ...updatedMessages,
                  { role: "assistant", content: assistantContent },
                ]);
              }
            } catch {
              // Skip malformed SSE chunks
            }
          }
        }
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Something went wrong";
        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: `Sorry, I had trouble connecting. ${errMsg}`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-x-hidden bg-background text-foreground">
      <Nav />

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto pt-14 pb-[140px] overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-5 py-6 sm:px-8 sm:py-8">
          {messages.length === 0 ? (
            /* Empty state — clean centered content */
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="mb-6 w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>

              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-2">
                Ask your coach
              </h2>
              <p className="text-muted text-sm mb-8 text-center max-w-sm leading-relaxed">
                Technique, strategy, rules, equipment. 100 expert articles ready
                to answer.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="btn-secondary text-sm px-4 py-2.5 min-h-[44px] touch-manipulation"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message thread */
            <div className="space-y-5">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center mt-1">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] min-w-0 rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-raised border border-border rounded-br-md"
                        : "bg-surface border border-border rounded-bl-md"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-sm text-foreground">{msg.content}</p>
                    ) : (
                      <div
                        className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: formatMarkdown(msg.content),
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading &&
                messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center mt-1">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-5 py-3.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-muted rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-muted/60 rounded-full animate-pulse [animation-delay:200ms]" />
                      <span className="w-1.5 h-1.5 bg-muted/30 rounded-full animate-pulse [animation-delay:400ms]" />
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input area — fixed bottom */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 w-full border-t border-border bg-background px-5 py-3 sm:px-8 sm:py-4">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about padel..."
              rows={1}
              className="input-field flex-1 resize-none max-h-32 !py-2.5"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-accent hover:bg-accent-hover disabled:bg-raised disabled:text-dim text-white flex items-center justify-center transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 14V2M8 2L3 7M8 2L13 7" />
              </svg>
            </button>
          </div>
          <p className="text-[11px] text-dim text-center mt-2">
            Answers grounded in 100 expert padel articles. May not always be
            perfect.
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Minimal markdown to HTML for chat messages.
 * Handles: **bold**, *italic*, bullet points, line breaks
 */
function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`(.+?)`/g,
      '<code class="bg-[var(--surface)] px-1.5 py-0.5 rounded text-xs border border-[var(--border)]">$1</code>'
    )
    .replace(
      /^- (.+)$/gm,
      '<span class="flex gap-2"><span class="text-[var(--accent)]">&#8226;</span><span>$1</span></span>'
    )
    .replace(
      /^(\d+)\. (.+)$/gm,
      '<span class="flex gap-2"><span class="text-[var(--accent)]">$1.</span><span>$2</span></span>'
    )
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
