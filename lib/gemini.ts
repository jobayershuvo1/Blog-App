/**
 * Minimal Google Gemini REST client (no SDK dependency).
 * Uses the free-tier generateContent endpoint.
 */
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

interface GeminiOptions {
  temperature?: number;
  maxOutputTokens?: number;
  /** Ask Gemini to return application/json. */
  json?: boolean;
}

export async function geminiGenerate(prompt: string, opts: GeminiOptions = {}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.8,
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || "")
    .join("");

  if (!text) throw new Error("Gemini returned an empty response.");
  return text.trim();
}

/** Parse a JSON object from a model response, tolerating ```json fences. */
export function parseJsonFromModel<T = unknown>(raw: string): T {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1) s = s.slice(start, end + 1);
  return JSON.parse(s) as T;
}
