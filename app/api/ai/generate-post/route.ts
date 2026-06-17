import { z } from "zod";
import { json, error, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { rateLimit } from "@/lib/rateLimit";
import { isGeminiConfigured, geminiGenerate, parseJsonFromModel } from "@/lib/gemini";

const schema = z.object({
  topic: z.string().min(3).max(300),
  tone: z.enum(["Professional", "Casual", "Academic", "Creative"]).default("Professional"),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  language: z.enum(["English", "Bengali", "Auto"]).default("English"),
});

const WORDS: Record<string, number> = { short: 500, medium: 1000, long: 2000 };

export async function POST(req: Request) {
  const { user, res } = await requireRole(ROLES.AUTHOR);
  if (res) return res;
  if (!isGeminiConfigured()) return error("AI is not configured (missing GEMINI_API_KEY).", 503);

  if (!rateLimit(`ai-gen:${user!.id}`, 20, 60 * 60 * 1000).success) {
    return error("AI rate limit reached. Try again later.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Invalid input.", 422);
  const { topic, tone, length, language } = parsed.data;

  const langInstruction =
    language === "Auto"
      ? "Write in the same language as the topic."
      : `Write entirely in ${language}.`;

  const prompt = `You are an expert blog writer. Write a complete, engaging, well-structured blog post.

Topic: "${topic}"
Tone: ${tone}
Target length: about ${WORDS[length]} words.
${langInstruction}

Return ONLY a valid JSON object with this exact shape:
{
  "title": "an engaging title",
  "content": "the full post body as semantic HTML using <h2>, <h3>, <p>, <ul>, <li>, <blockquote> tags (no <html>, <head>, or <body> tags, no markdown)",
  "metaDescription": "a compelling SEO meta description under 160 characters",
  "tags": ["5", "relevant", "lowercase", "tags"]
}`;

  try {
    const raw = await geminiGenerate(prompt, { json: true, temperature: 0.85, maxOutputTokens: 6000 });
    const data = parseJsonFromModel<{
      title: string;
      content: string;
      metaDescription: string;
      tags: string[];
    }>(raw);
    return json({
      title: data.title || topic,
      content: data.content || "",
      metaDescription: (data.metaDescription || "").slice(0, 160),
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 8) : [],
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Generation failed.", 502);
  }
}
