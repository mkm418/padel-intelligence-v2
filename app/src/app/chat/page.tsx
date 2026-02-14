"use client";

/**
 * Padel Coach AI - Chat Interface
 *
 * Clean, fast chat UI with streaming responses.
 * Connects to /api/chat which does RAG retrieval + OpenRouter.
 */

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Suggested starter questions
const STARTERS = [
  "How do I hit a bandeja?",
  "What racket should I buy as a beginner?",
  "Explain the golden point rule",
  "How do I transition from defense to offense?",
  "What's the difference between padel and tennis?",
  "Best warm-up routine before a match?",
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
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
              P
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">
                Padel Coach AI
              </h1>
              <p className="text-xs text-white/40">
                Powered by 100 expert knowledge articles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-white/40 hover:text-white transition-colors">Home</a>
            <a href="/network" className="text-xs text-white/40 hover:text-emerald-400 transition-colors">Network</a>
            <a href="/rankings" className="text-xs text-white/40 hover:text-emerald-400 transition-colors">Rankings</a>
            <a href="/h2h" className="text-xs text-white/40 hover:text-emerald-400 transition-colors">H2H</a>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            // Empty state with suggested starters
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-2xl font-bold mb-6">
                P
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Ask me anything about padel
              </h2>
              <p className="text-white/40 text-sm mb-8 text-center max-w-md">
                Technique, strategy, rules, equipment, fitness, history — I've
                got 100 expert articles ready to help you improve your game.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left text-sm px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white/70 hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Message thread
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold mt-1">
                      P
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] ${
                      msg.role === "user"
                        ? "bg-white/10 rounded-2xl rounded-br-md px-4 py-3"
                        : "prose prose-invert prose-sm max-w-none"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <div
                        className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap"
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
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold mt-1">
                      P
                    </div>
                    <div className="flex items-center gap-1 py-3">
                      <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input area */}
      <footer className="flex-shrink-0 border-t border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-emerald-500/50 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about padel..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 resize-none outline-none max-h-32"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/20 text-black flex items-center justify-center transition-colors"
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
          <p className="text-[10px] text-white/20 text-center mt-2">
            Answers grounded in 100 expert padel articles. May not always be
            perfect.
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Minimal markdown → HTML for chat messages
 * Handles: **bold**, *italic*, bullet points, line breaks
 */
function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1 rounded text-xs">$1</code>')
    .replace(/^- (.+)$/gm, '<span class="flex gap-2"><span class="text-emerald-400">•</span><span>$1</span></span>')
    .replace(/^(\d+)\. (.+)$/gm, '<span class="flex gap-2"><span class="text-emerald-400">$1.</span><span>$2</span></span>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, "<br/>");
}
