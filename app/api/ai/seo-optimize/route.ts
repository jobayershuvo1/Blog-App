import { z } from "zod";
import { json, error, requireRole } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { rateLimit } from "@/lib/rateLimit";
import { isGeminiConfigured, geminiGenerate, parseJsonFromModel } from "@/lib/gemini";
import { stripHtml } from "@/lib/utils";

const schema = z.object({ title: z.string().min(1), content: z.string().min(1) });

export async function POST(req: Request) {
  const { user, res } = await requireRole(ROLES.AUTHOR);
  if (res) return res;
  if (!isGeminiConfigured()) return error("AI is not configured (missing GEMINI_API_KEY).", 503);
  if (!rateLimit(`ai-seo:${user!.id}`, 30, 60 * 60 * 1000).success) {
    return error("AI rate limit reached. Try again later.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Invalid input.", 422);

  const text = stripHtml(parsed.data.content).slice(0, 4000);
  const prompt = `You are an SEO expert. Analyze this blog post and optimize it for search.

Title: "${parsed.data.title}"
Content: "${text}"

Return ONLY valid JSON:
{
  "metaTitle": "SEO title, max 60 chars",
  "metaDescription": "compelling meta description, 140-160 chars",
  "focusKeyword": "the single best focus keyword phrase",
  "suggestions": ["3-5 short, actionable SEO improvement tips"]
}`;

  try {
    const raw = await geminiGenerate(prompt, { json: true, temperature: 0.4 });
    const data = parseJsonFromModel<{
      metaTitle: string;
      metaDescription: string;
      focusKeyword: string;
      suggestions: string[];
    }>(raw);
    return json({
      metaTitle: (data.metaTitle || "").slice(0, 60),
      metaDescription: (data.metaDescription || "").slice(0, 160),
      focusKeyword: data.focusKeyword || "",
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : "SEO analysis failed.", 502);
  }
}
