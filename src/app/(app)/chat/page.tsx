"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import { useDailyLog } from "@/lib/store/trackerStore";
import { usePlanStore } from "@/lib/store/planStore";
import { useChatStore } from "@/lib/store/chatStore";
import { todayKey } from "@/lib/utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What should I eat today?",
  "How many calories left?",
  "Suggest dinner under 400 calories",
  "I have eggs and chicken, generate a recipe",
  "Can I eat biryani?",
  "Healthy restaurant options",
  "Motivate me",
];

export default function ChatPage() {
  const profile = useUserStore((s) => s.profile);
  const calc = useUserStore((s) => s.calculations);
  const log = useDailyLog(todayKey());
  const mealPlan = usePlanStore((s) => s.mealPlan);
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (!profile || !calc) return null;

  const todayName = format(new Date(), "EEEE");
  const todayMeals = mealPlan?.days.find((d) => d.day === todayName);

  async function send(message: string) {
    if (!message.trim() || loading) return;
    addMessage({ role: "user", content: message });
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context: { profile, calc, log, todayMeals } }),
      });
      const data = await res.json();
      addMessage({ role: "assistant", content: data.reply ?? "Sorry, I couldn't come up with an answer right now." });
    } catch {
      addMessage({ role: "assistant", content: "I'm having trouble connecting right now — please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-2xl flex-col">
      <div className="mb-3">
        <h1 className="text-xl font-bold">AI Chat Coach</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Ask about meals, calories, workouts, or get motivated.</p>
      </div>

      <div ref={scrollRef} className="glass-card mb-3 flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-white">
              <Sparkles size={22} />
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="chip">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn("max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "text-white" : "solid-card")}
                style={m.role === "user" ? { backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))" } : undefined}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="solid-card flex gap-1 rounded-2xl px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--primary)", animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--primary)", animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--primary)", animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          className="input-field"
          placeholder="Ask your AI coach anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary !px-4" disabled={loading}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
