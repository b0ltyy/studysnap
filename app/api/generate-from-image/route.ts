import { NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  imageBase64: z.string().min(50),
  mimeType: z.string().min(3),
});

function extractJSONObject(maybeText: string) {
  // probeer direct JSON
  try {
    return JSON.parse(maybeText);
  } catch {}

  // fallback: pak eerste { ... laatste }
  const start = maybeText.indexOf("{");
  const end = maybeText.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = maybeText.slice(start, end + 1);
    return JSON.parse(slice);
  }

  throw new Error("Model output is not valid JSON.");
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY ontbreekt in .env.local");
    }

    const prompt = `
Gebruik ENKEL wat je op de foto kan lezen. Niets verzinnen.
Maak exact 10 oefenvragen.

GEEF ALLEEN GELDIGE JSON TERUG (geen uitleg, geen markdown).
Schema:
{
  "title": "korte titel",
  "questions": [
    {
      "type": "short_answer|true_false|multiple_choice",
      "difficulty": "easy|medium|hard",
      "question": "...",
      "choices": ["A","B","C","D"],  // alleen bij multiple_choice
      "answer": "...",
      "explanation": "...",
      "evidence": "korte snippet uit de tekst op de foto"
    }
  ]
}

Regels:
- Mix: 4 easy, 4 medium, 2 hard
- Minstens 3 multiple_choice
- evidence moet echt uit de foto komen
`.trim();

    // ✅ v1 endpoint + model
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: body.mimeType,
                  data: body.imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 2200,
          // geen responseMimeType hier (werkt niet in jouw v1)
          // temperature: 0.3,  // optional
        },
      }),
    });

    const raw = await res.text();
    if (!res.ok) throw new Error(raw);

    const outer = JSON.parse(raw);
    const text = outer?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error("Geen tekst-output van Gemini (candidates leeg).");

    const data = extractJSONObject(text);

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
