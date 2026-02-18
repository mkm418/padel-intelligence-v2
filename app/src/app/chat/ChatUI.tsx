"use client";

/**
 * Padel Coach AI - Chat Interface
 *
 * Premium chat UI with streaming responses, rich markdown,
 * and a distinctive visual identity.
 */

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Starter prompts grouped by category
const STARTERS = [
  { icon: "🎾", label: "Bandeja technique", prompt: "How do I hit a bandeja?" },
  { icon: "🧠", label: "Court positioning", prompt: "Explain the best positioning strategies in padel doubles" },
  { icon: "📏", label: "Golden point rule", prompt: "Explain the golden point rule" },
  { icon: "🏋️", label: "Injury prevention", prompt: "What are the best warm-up exercises before playing padel?" },
  { icon: "🎯", label: "Serve strategy", prompt: "What are the most effective serve strategies in padel?" },
  { icon: "🔄", label: "Wall play", prompt: "How do I play the back wall effectively?" },
];

export default function ChatUI() {
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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || input.trim();
      if (!messageText || isLoading) return;

      const userMessage: Message = { role: "user", content: messageText };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

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

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let assistantContent = "";
        let buffer = "";

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
    [input, isLoading, messages],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col bg-background text-foreground" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* Messages area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[160px]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {!hasMessages ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center min-h-[70vh] pt-8">
              {/* Logo mark */}
              <div className="relative mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-lg shadow-accent/20">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">AI</span>
                </div>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 text-center">
                Padel AI Coach
              </h1>
              <p className="text-muted text-base mb-10 text-center max-w-md leading-relaxed">
                Your personal padel expert. Ask about technique, strategy, rules,
                or equipment &mdash; powered by 100+ expert articles.
              </p>

              {/* Starter cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg">
                {STARTERS.map((s) => (
                  <button
                    key={s.prompt}
                    onClick={() => sendMessage(s.prompt)}
                    className="group flex flex-col items-start gap-2 p-4 rounded-xl bg-surface border border-border
                               hover:border-accent/40 hover:shadow-md hover:shadow-accent/5
                               transition-all duration-200 text-left"
                  >
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors leading-snug">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Message thread ── */
            <div className="py-6 space-y-1">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "user" ? (
                    /* User bubble */
                    <div className="flex justify-end mb-4">
                      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent text-white px-4 py-3 shadow-sm">
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    /* Assistant message */
                    <div className="mb-6">
                      {/* Coach label */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center flex-shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Coach</span>
                      </div>
                      {/* Content */}
                      <div className="pl-8">
                        <div
                          className="prose-chat text-sm text-foreground/90 leading-[1.75]"
                          dangerouslySetInnerHTML={{
                            __html: formatMarkdown(msg.content),
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Coach</span>
                  </div>
                  <div className="pl-8 flex items-center gap-1.5 h-6">
                    <span className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-accent/20 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* ── Input area ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        {/* Gradient fade */}
        <div className="h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="bg-background px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-end gap-2 bg-surface border border-border rounded-2xl px-4 py-2 shadow-lg shadow-black/5 focus-within:border-accent/50 focus-within:shadow-accent/5 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about padel..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-dim resize-none max-h-32 py-2.5 outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent hover:bg-accent-hover
                           disabled:bg-border disabled:text-dim
                           text-white flex items-center justify-center transition-all
                           active:scale-95 mb-0.5"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 14V2M8 2L3 7M8 2L13 7" />
                </svg>
              </button>
            </div>
            <p className="text-[11px] text-dim text-center mt-2.5 leading-relaxed">
              Grounded in 100+ expert padel articles &middot; May not always be perfect
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Rich markdown to HTML for chat messages.
 * Handles: **bold**, *italic*, `code`, headings, lists, line breaks
 */
function formatMarkdown(text: string): string {
  return (
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Headings (### h3, ## h2)
      .replace(
        /^### (.+)$/gm,
        '<h4 class="font-semibold text-foreground mt-4 mb-1">$1</h4>',
      )
      .replace(
        /^## (.+)$/gm,
        '<h3 class="font-semibold text-foreground text-base mt-5 mb-1.5">$1</h3>',
      )
      // Bold + italic
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Inline code
      .replace(
        /`(.+?)`/g,
        '<code class="bg-raised px-1.5 py-0.5 rounded-md text-xs font-mono border border-border text-accent">$1</code>',
      )
      // Bullet lists
      .replace(
        /^- (.+)$/gm,
        '<div class="flex gap-2.5 py-0.5"><span class="text-accent mt-[1px] flex-shrink-0">&#x2022;</span><span>$1</span></div>',
      )
      // Numbered lists
      .replace(
        /^(\d+)\. (.+)$/gm,
        '<div class="flex gap-2.5 py-0.5"><span class="text-accent font-semibold min-w-[1.25rem] text-right flex-shrink-0">$1.</span><span>$2</span></div>',
      )
      // Source references - make them subtle
      .replace(
        /\(Source: (.+?)\)/g,
        '<span class="text-dim text-xs">(Source: $1)</span>',
      )
      // Paragraphs
      .replace(/\n\n/g, '<div class="h-3"></div>')
      .replace(/\n/g, "<br/>")
  );
}
