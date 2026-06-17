import { json, error, requireRole } from "@/lib/api";
import { ROLES, MAX_UPLOAD_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { isCloudinaryConfigured, uploadBuffer } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { res } = await requireRole(ROLES.AUTHOR);
  if (res) return res;

  if (!isCloudinaryConfigured()) {
    return error("Image uploads are not configured (missing Cloudinary credentials).", 503);
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return error("No file provided.", 422);

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return error("Unsupported file type. Use JPG, PNG, WEBP, or GIF.", 422);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return error("File too large. Maximum size is 5MB.", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const result = await uploadBuffer(buffer, "blogforge/posts");
    return json({ url: result.url, width: result.width, height: result.height });
  } catch {
    return error("Upload failed. Please try again.", 500);
  }
}
