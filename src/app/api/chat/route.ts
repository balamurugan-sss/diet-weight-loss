import { NextResponse } from "next/server";
import { answerQuestion, type ChatContext } from "@/lib/ai/chatCoach";

interface ChatRequestBody {
  message: string;
  context: ChatContext;
}

async function askOpenAI(message: string, context: ChatContext, apiKey: string): Promise<string | null> {
  try {
    const { profile, calc, log } = context;
    const systemPrompt = `You are FitFusion AI, a supportive weight-loss coach. User: ${profile.name}, ${profile.age}${profile.gender[0]}, goal: ${profile.goal} (${profile.goalSpeed}), health conditions: ${profile.healthConditions.join(", ") || "none"}. Daily target: ${calc.dailyCalories} kcal, ${calc.proteinG}g protein. Today so far: ${log.caloriesConsumed} kcal, ${log.proteinG}g protein, ${log.steps} steps. Be concise, warm, and practical. Never give medical diagnoses.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.message || !body?.context?.profile || !body?.context?.calc || !body?.context?.log) {
    return NextResponse.json({ error: "message and context (profile, calc, log) are required" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const aiReply = await askOpenAI(body.message, body.context, apiKey);
    if (aiReply) {
      return NextResponse.json({ reply: aiReply, source: "openai" });
    }
  }

  const reply = answerQuestion(body.message, body.context);
  return NextResponse.json({ reply, source: "rule-based" });
}
