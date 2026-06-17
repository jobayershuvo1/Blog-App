import { z } from "zod";
import { connectDB } from "@/lib/db";
import { json, error } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { getClientIp, stripHtml } from "@/lib/utils";
import Post from "@/models/Post";
import Translation from "@/models/Translation";
import { POST_STATUS } from "@/lib/constants";

/** Translate a single chunk (<= ~500 chars) via the free MyMemory API. */
async function translateChunk(text: string, source: string, target: string): Promise<string> {
  const email = process.env.GMAIL_USER ? `&de=${encodeURIComponent(process.env.GMAIL_USER)}` : "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${source}|${target}${email}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translation service error.");
  const data = await res.json();
  return data?.responseData?.translatedText || text;
}

/** Split long text into <=450 char chunks on sentence/space boundaries. */
function chunk(text: string, max = 450): string[] {
  const parts: string[] = [];
  let buf = "";
  for (const sentence of text.split(/(?<=[.!?。\n])\s+/)) {
    if ((buf + " " + sentence).length > max) {
      if (buf) parts.push(buf.trim());
      buf = sentence;
    } else {
      buf += " " + sentence;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.filter(Boolean);
}

async function translateLong(text: string, source: string, target: string): Promise<string> {
  const chunks = chunk(text);
  const out: string[] = [];
  for (const c of chunks) {
    // eslint-disable-next-line no-await-in-loop
    out.push(await translateChunk(c, source, target));
  }
  return out.join(" ");
}

const schema = z.object({
  postId: z.string().optional(),
  text: z.string().optional(),
  title: z.string().optional(),
  source: z.string().default("en"),
  target: z.string().min(2).max(5),
});

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(`translate:${ip}`, 30, 60 * 60 * 1000).success) {
    return error("Translation rate limit reached. Try again later.", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return error("Invalid input.", 422);
  const { postId, text, title, source, target } = parsed.data;

  try {
    // ── Post translation with DB caching ──
    if (postId) {
      await connectDB();
      const cached = await Translation.findOne({ post: postId, language: target }).lean<any>();
      if (cached) return json({ title: cached.title, content: cached.content, cached: true });

      const post = await Post.findOne({ _id: postId, status: POST_STATUS.APPROVED }).lean<any>();
      if (!post) return error("Post not found.", 404);

      const plain = stripHtml(post.content);
      const [tTitle, tContent] = await Promise.all([
        translateChunk(post.title.slice(0, 480), source, target),
        translateLong(plain, source, target),
      ]);
      const html = tContent
        .split(/\n+/)
        .map((p) => `<p>${p}</p>`)
        .join("");

      await Translation.create({ post: postId, language: target, title: tTitle, content: html });
      return json({ title: tTitle, content: html, cached: false });
    }

    // ── Ad-hoc text translation (editor) ──
    if (text) {
      const translated = await translateLong(stripHtml(text), source, target);
      const tTitle = title ? await translateChunk(title.slice(0, 480), source, target) : undefined;
      return json({ title: tTitle, content: translated });
    }

    return error("Provide either postId or text.", 422);
  } catch (e) {
    return error(e instanceof Error ? e.message : "Translation failed.", 502);
  }
}
