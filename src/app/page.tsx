import Link from "next/link";
import {
  Sparkles,
  Salad,
  Dumbbell,
  LineChart,
  MessageCircle,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { LandingRedirect } from "@/components/landing/LandingRedirect";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Coaching",
    desc: "Daily personalized insights, motivation, and recommendations tailored to your goals.",
  },
  {
    icon: Salad,
    title: "Weekly Meal Plans",
    desc: "Full recipes with exact macros, ingredients, steps, and shopping lists — every week.",
  },
  {
    icon: Dumbbell,
    title: "Smart Workout Plans",
    desc: "Home & gym routines for every level, with knee-friendly options built in.",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    desc: "Beautiful charts for weight, BMI, macros, and habits — daily to yearly.",
  },
  {
    icon: MessageCircle,
    title: "AI Chat Coach",
    desc: "Ask anything: \"What should I eat?\", \"Can I eat biryani?\", \"Motivate me.\"",
  },
  {
    icon: ShoppingCart,
    title: "Smart Shopping Lists",
    desc: "Auto-generated grocery lists from your weekly meal plan, organized by aisle.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <LandingRedirect />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white font-bold">F</div>
          <span className="text-lg font-bold">
            Fit<span className="gradient-text">Fusion</span> AI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/onboarding" className="btn-primary !px-4 !py-2 text-sm">
            Get Started
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-2 lg:items-center lg:py-20">
        <div>
          <span className="chip mb-5" style={{ color: "var(--primary-2)" }}>
            <Sparkles size={14} /> Your Personal AI Weight Loss Coach
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Lose weight the <span className="gradient-text">smart & sustainable</span> way
          </h1>
          <p className="mt-5 max-w-lg text-base" style={{ color: "var(--muted)" }}>
            FitFusion AI builds a personalized nutrition, workout, and tracking plan around your
            body, goals, and health conditions — then coaches you every single day to stay on
            track.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/onboarding" className="btn-primary">
              Start Your Journey <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard" className="btn-secondary">
              I already have a profile
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm" style={{ color: "var(--muted)" }}>
            <span>✓ No credit card required</span>
            <span>✓ Works for men & women</span>
            <span>✓ Diabetes / PCOS / thyroid aware</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -top-10 -left-6 h-40 w-40 rounded-full bg-emerald-400/30 blur-3xl" />
          <div className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-violet-400/30 blur-3xl" />
          <div className="glass-card relative flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Today&apos;s Progress</p>
              <span className="chip chip-active">Day 14</span>
            </div>
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text">1,840</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>calories left</p>
              </div>
              <div className="h-12 w-px" style={{ background: "var(--card-border)" }} />
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text">-4.2kg</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>since start</p>
              </div>
            </div>
            <div className="solid-card flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-accent text-white">
                <Salad size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">High Protein Veg Oats</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>350 kcal · 24g protein</p>
              </div>
            </div>
            <div className="solid-card flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-white">
                <Dumbbell size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">Full Body HIIT</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>25 min · 280 kcal burn</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Everything you need to reach your <span className="gradient-text">goal weight</span>
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-white">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
        <div className="glass-card p-10">
          <h2 className="text-2xl font-bold">Ready to start your transformation?</h2>
          <p className="mt-2" style={{ color: "var(--muted)" }}>
            Takes about 2 minutes. Get your personalized plan instantly.
          </p>
          <Link href="/onboarding" className="btn-primary mt-6 inline-flex">
            Build My Plan <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
