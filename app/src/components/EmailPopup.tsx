"use client";

/**
 * Scroll-triggered email capture popup.
 *
 * Appears after the user scrolls past a threshold (default 60%) or after
 * a time delay. Dismisses to localStorage so it only shows once per session.
 * Adapts to source for tracking.
 */

import { useState, useEffect, useCallback } from "react";

interface EmailPopupProps {
  /** Tracking source stored in signups table */
  source?: string;
  /** Scroll percentage (0-100) to trigger popup. Default: 55 */
  scrollThreshold?: number;
  /** Time delay in ms before allowing popup. Default: 15000 (15s) */
  timeDelay?: number;
}

const DISMISS_KEY = "pp_email_popup_dismissed";

export default function EmailPopup({
  source = "rankings_popup",
  scrollThreshold = 55,
  timeDelay = 15000,
}: EmailPopupProps) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Don't show if already dismissed
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    let timeReady = false;
    let scrollReady = false;
    let shown = false;

    const maybeShow = () => {
      if (shown) return;
      if (timeReady && scrollReady) {
        shown = true;
        setVisible(true);
      }
    };

    // Time gate
    const timer = setTimeout(() => {
      timeReady = true;
      maybeShow();
    }, timeDelay);

    // Scroll gate
    const onScroll = () => {
      const scrollPct =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPct >= scrollThreshold) {
        scrollReady = true;
        maybeShow();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [scrollThreshold, timeDelay]);

  const dismiss = useCallback(() => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || state === "loading") return;

      setState("loading");
      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), source }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setState("done");
        setMessage(data.message || "You're in!");
        // Auto-dismiss after success
        setTimeout(() => {
          dismiss();
        }, 3000);
      } catch (err) {
        setState("error");
        setMessage(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    [email, state, source, dismiss],
  );

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={dismiss}
      />

      {/* Popup */}
      <div className="fixed z-50 bottom-4 left-4 right-4 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="card p-6 sm:p-8 shadow-2xl border-accent/10 relative">
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface hover:bg-raised flex items-center justify-center text-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {state === "done" ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-base font-bold text-foreground">{message}</p>
              <p className="text-sm text-muted mt-1">Check your inbox Monday.</p>
            </div>
          ) : (
            /* Capture form */
            <>
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 21V11m4 10V7m4 14V3m-8 0h8" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    Weekly Rankings Email
                  </h3>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  Get Miami&apos;s top movers, hot streaks, and new players delivered every Monday. Join 500+ padel players.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
                  placeholder="your@email.com"
                  required
                  className="input-field w-full !py-3"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="btn-primary w-full !py-3 disabled:opacity-50"
                >
                  {state === "loading" ? "Signing up..." : "Get Weekly Rankings"}
                </button>
                {state === "error" && (
                  <p className="text-xs text-loss text-center">{message}</p>
                )}
              </form>

              <p className="text-[11px] text-dim text-center mt-4">
                Free forever. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
