"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Shield, RefreshCw } from "lucide-react";
import { RECIPES } from "@/lib/data/recipes";
import { FOODS } from "@/lib/data/foods";
import { EXERCISES } from "@/lib/data/exercises";
import { useAdminStore } from "@/lib/store/adminStore";
import { useUserStore } from "@/lib/store/userStore";
import { usePlanStore } from "@/lib/store/planStore";
import { generateWeeklyWorkoutPlan } from "@/lib/ai/workoutPlanner";
import { cn } from "@/lib/utils";

type AdminTab = "overview" | "recipes" | "foods" | "workouts" | "content" | "prompts";

const TABS: { value: AdminTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "recipes", label: "Recipes" },
  { value: "foods", label: "Foods" },
  { value: "workouts", label: "Workout Plans" },
  { value: "content", label: "Blogs & FAQs" },
  { value: "prompts", label: "AI Prompts" },
];

const CHAT_INTENTS = [
  { intent: "Motivate me", example: "\"Motivate me\", \"encourage me\"" },
  { intent: "Calories remaining", example: "\"How many calories left?\"" },
  { intent: "Restaurant options", example: "\"Healthy restaurant options\"" },
  { intent: "Dinner suggestion under a limit", example: "\"Suggest dinner under 400 calories\"" },
  { intent: "Ingredient-based recipe", example: "\"I have eggs and chicken, generate a recipe\"" },
  { intent: "Food/health check", example: "\"Can I eat biryani?\"" },
  { intent: "Next meal", example: "\"What should I eat today?\"" },
  { intent: "Fallback", example: "Anything else -> personalized daily insight" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const profile = useUserStore((s) => s.profile);
  const isPremium = useUserStore((s) => s.isPremium);
  const admin = useAdminStore();
  const workoutPlan = usePlanStore((s) => s.workoutPlan);
  const setWorkoutPlan = usePlanStore((s) => s.setWorkoutPlan);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold"><Shield size={20} /> Admin Panel</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Manage FitFusion AI&apos;s content library. This is a local, single-device admin view — a hosted deployment would gate this behind an admin role.
        </p>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)} className={cn("chip shrink-0", tab === t.value && "chip-active")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Recipes in DB" value={`${RECIPES.length + admin.customRecipes.length}`} />
          <StatCard label="Foods in DB" value={`${FOODS.length + admin.customFoods.length}`} />
          <StatCard label="Exercises in DB" value={`${EXERCISES.length}`} />
          <StatCard label="Current User" value={profile?.name ?? "No profile"} />
          <StatCard label="Premium Status" value={isPremium ? "Premium" : "Free"} />
          <StatCard label="Blog Posts / FAQs" value={`${admin.blogPosts.length} / ${admin.faqs.length}`} />
        </div>
      )}

      {tab === "recipes" && (
        <div className="glass-card p-6">
          <h2 className="mb-4 font-semibold">Custom Recipes</h2>
          <AddRecipeForm />
          <div className="mt-5 flex flex-col gap-2">
            {admin.customRecipes.map((r) => (
              <div key={r.id} className="solid-card flex items-center justify-between px-4 py-2.5 text-sm">
                <span>{r.name} — {r.calories} kcal ({r.slot})</span>
                <button onClick={() => admin.removeCustomRecipe(r.id)} style={{ color: "var(--muted)" }}><Trash2 size={16} /></button>
              </div>
            ))}
            {admin.customRecipes.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>No custom recipes yet. The seeded {RECIPES.length}-recipe database powers meal planning by default.</p>
            ) : (
              <p className="text-xs" style={{ color: "var(--muted)" }}>Custom recipes are included in the Meal Planner and Recipe Generator pools alongside the seeded database.</p>
            )}
          </div>
        </div>
      )}

      {tab === "foods" && (
        <div className="glass-card p-6">
          <h2 className="mb-4 font-semibold">Custom Foods</h2>
          <AddFoodForm />
          <div className="mt-5 flex flex-col gap-2">
            {admin.customFoods.map((f) => (
              <div key={f.id} className="solid-card flex items-center justify-between px-4 py-2.5 text-sm">
                <span>{f.name} — {f.calories} kcal ({f.category})</span>
                <button onClick={() => admin.removeCustomFood(f.id)} style={{ color: "var(--muted)" }}><Trash2 size={16} /></button>
              </div>
            ))}
            {admin.customFoods.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>No custom foods yet. The seeded {FOODS.length}-item database powers Food Search by default.</p>
            ) : (
              <p className="text-xs" style={{ color: "var(--muted)" }}>Custom foods appear in Food Search alongside the seeded database.</p>
            )}
          </div>
        </div>
      )}

      {tab === "workouts" && (
        <div className="glass-card p-6">
          <h2 className="mb-4 font-semibold">Workout Plan</h2>
          {workoutPlan ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {workoutPlan.environment} · {workoutPlan.level} · Week of {workoutPlan.weekOf}
              </p>
              {workoutPlan.days.map((d) => (
                <div key={d.day} className="solid-card flex items-center justify-between px-4 py-2.5 text-sm">
                  <span>{d.day} — {d.focus}</span>
                  <span style={{ color: "var(--muted)" }}>{d.exercises.length} exercises</span>
                </div>
              ))}
              {profile && (
                <button onClick={() => setWorkoutPlan(generateWeeklyWorkoutPlan(profile))} className="btn-secondary mt-2 self-start !py-2 text-sm">
                  <RefreshCw size={14} /> Regenerate
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>No workout plan generated yet — visit <Link href="/workouts" className="underline">Workout Planner</Link>.</p>
          )}
        </div>
      )}

      {tab === "content" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="glass-card p-6">
            <h2 className="mb-4 font-semibold">Blog Posts</h2>
            <AddBlogForm />
            <div className="mt-4 flex flex-col gap-2">
              {admin.blogPosts.map((p) => (
                <div key={p.id} className="solid-card px-4 py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{p.title}</span>
                    <button onClick={() => admin.removeBlogPost(p.id)} style={{ color: "var(--muted)" }}><Trash2 size={14} /></button>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{p.body}</p>
                </div>
              ))}
              {admin.blogPosts.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>No posts yet.</p>}
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="mb-4 font-semibold">FAQs</h2>
            <AddFaqForm />
            <div className="mt-4 flex flex-col gap-2">
              {admin.faqs.map((f) => (
                <div key={f.id} className="solid-card px-4 py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{f.question}</span>
                    <button onClick={() => admin.removeFaq(f.id)} style={{ color: "var(--muted)" }}><Trash2 size={14} /></button>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{f.answer}</p>
                </div>
              ))}
              {admin.faqs.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>No FAQs yet.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "prompts" && (
        <div className="glass-card p-6">
          <h2 className="mb-2 font-semibold">AI Chat Coach — Recognized Intents</h2>
          <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
            Read-only reference for the rule-based intent matcher in <code>lib/ai/chatCoach.ts</code>. When
            <code className="mx-1">OPENAI_API_KEY</code> is set, <code>/api/chat</code> calls OpenAI instead and this matcher is used only as a fallback.
          </p>
          <div className="flex flex-col gap-2">
            {CHAT_INTENTS.map((i) => (
              <div key={i.intent} className="solid-card px-4 py-2.5 text-sm">
                <p className="font-medium">{i.intent}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{i.example}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <p className="text-lg font-bold gradient-text">{value}</p>
      <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>
    </div>
  );
}

function AddRecipeForm() {
  const addCustomRecipe = useAdminStore((s) => s.addCustomRecipe);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");

  function submit() {
    if (!name || !calories) return;
    addCustomRecipe({
      id: crypto.randomUUID(),
      name,
      slot: "lunch",
      cuisine: ["indian"],
      tags: ["vegetarian"],
      calories: Number(calories),
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      servingSize: "1 serving",
      prepTimeMin: 10,
      cookTimeMin: 10,
      difficulty: "easy",
      ingredients: [],
      instructions: [],
      nutritionalBenefits: [],
      storageTips: "",
      healthyAlternatives: [],
      image: "",
    });
    setName("");
    setCalories("");
  }

  return (
    <div className="flex gap-2">
      <input className="input-field" placeholder="Recipe name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input-field w-28" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} />
      <button onClick={submit} className="btn-primary !px-4"><Plus size={16} /></button>
    </div>
  );
}

function AddFoodForm() {
  const addCustomFood = useAdminStore((s) => s.addCustomFood);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");

  function submit() {
    if (!name || !calories) return;
    addCustomFood({
      id: crypto.randomUUID(),
      name,
      category: "indian",
      servingSize: "1 serving",
      calories: Number(calories),
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      sugarG: 0,
      sodiumMg: 0,
    });
    setName("");
    setCalories("");
  }

  return (
    <div className="flex gap-2">
      <input className="input-field" placeholder="Food name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input-field w-28" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} />
      <button onClick={submit} className="btn-primary !px-4"><Plus size={16} /></button>
    </div>
  );
}

function AddBlogForm() {
  const addBlogPost = useAdminStore((s) => s.addBlogPost);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function submit() {
    if (!title) return;
    addBlogPost({ title, body });
    setTitle("");
    setBody("");
  }

  return (
    <div className="flex flex-col gap-2">
      <input className="input-field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input-field" rows={2} placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
      <button onClick={submit} className="btn-secondary self-start !py-1.5 text-sm"><Plus size={14} /> Add Post</button>
    </div>
  );
}

function AddFaqForm() {
  const addFaq = useAdminStore((s) => s.addFaq);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  function submit() {
    if (!question) return;
    addFaq({ question, answer });
    setQuestion("");
    setAnswer("");
  }

  return (
    <div className="flex flex-col gap-2">
      <input className="input-field" placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
      <textarea className="input-field" rows={2} placeholder="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <button onClick={submit} className="btn-secondary self-start !py-1.5 text-sm"><Plus size={14} /> Add FAQ</button>
    </div>
  );
}
