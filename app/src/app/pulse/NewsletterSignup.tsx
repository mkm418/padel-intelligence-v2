"use client";

import { useState, useCallback } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || state === "loading") return;

      setState("loading");
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            source: "miami_pulse",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setState("done");
        setMessage(data.message || "You're in!");
      } catch (err) {
        setState("error");
        setMessage(
          err instanceof Error ? err.message : "Something went wrong",
        );
      }
    },
    [email, state],
  );

  if (state === "done") {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-semibold">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
        {message} Check your inbox Tuesday.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 max-w-md"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state === "error") setState("idle");
        }}
        placeholder="your@email.com"
        required
        className="input-field flex-1 !py-3 sm:!py-2.5"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="btn-primary whitespace-nowrap !py-3 sm:!py-2.5 disabled:opacity-50"
      >
        {state === "loading" ? "..." : "Get the Pulse"}
      </button>
      {state === "error" && (
        <p className="text-xs text-loss sm:hidden">{message}</p>
      )}
    </form>
  );
}
