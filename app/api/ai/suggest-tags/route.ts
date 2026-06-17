import { z } from "zod";
import { json, error, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { isGeminiConfigured, geminiGenerate, parseJsonFromModel } from "@/lib/gemini";
import { stripHtml } from "@/lib/utils";

const schema = z.object({ title: z.string().optional(), content: z.string().min(1) });

export async function POST(req: Request) {
  const { res } = await requireRole(ROLES.AUTHOR);
  if (res) return res;
  if (!isGeminiConfigured()) return error("AI is not configured (missing GEMINI_API_KEY).", 503);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Invalid input.", 422);

  const text = stripHtml(parsed.data.content).slice(0, 3000);
  const prompt = `Suggest 8 relevant, concise, lowercase tags for this blog post.
Title: "${parsed.data.title || ""}"
Content: "${text}"
Return ONLY JSON: { "tags": ["tag1", "tag2", ...] }`;

  try {
    const raw = await geminiGenerate(prompt, { json: true, temperature: 0.5 });
    const data = parseJsonFromModel<{ tags: string[] }>(raw);
    return json({ tags: Array.isArray(data.tags) ? data.tags.slice(0, 10) : [] });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Tag suggestion failed.", 502);
  }
}
