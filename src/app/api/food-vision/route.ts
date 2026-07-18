import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Image recognition requires an OPENAI_API_KEY to be configured on the server." },
      { status: 503 }
    );
  }

  let body: { imageBase64?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify the food in this image and estimate its nutrition per typical serving. Respond ONLY with strict JSON: {\"name\": string, \"servingSize\": string, \"calories\": number, \"proteinG\": number, \"carbsG\": number, \"fatG\": number}.",
              },
              { type: "image_url", image_url: { url: body.imageBase64 } },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Vision request failed" }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    return NextResponse.json({ food: parsed });
  } catch {
    return NextResponse.json({ error: "Could not analyze image" }, { status: 500 });
  }
}
