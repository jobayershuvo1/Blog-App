export const ROLES = {
  SUPER_ADMIN: "super_admin",
  MODERATOR: "moderator",
  AUTHOR: "author",
  READER: "reader",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Higher number = more privileges. */
export const ROLE_RANK: Record<Role, number> = {
  reader: 0,
  author: 1,
  moderator: 2,
  super_admin: 3,
};

export function hasAtLeast(role: Role | undefined | null, min: Role): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export const POST_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

export const REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const LOCALES = ["en", "bn", "ar", "hi", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES: Locale[] = ["ar"];

/** Languages offered by the post translator (MyMemory supports these). */
export const TRANSLATE_LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "ar", label: "العربية (Arabic)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "it", label: "Italiano (Italian)" },
  { code: "pt", label: "Português (Portuguese)" },
  { code: "ru", label: "Русский (Russian)" },
  { code: "ja", label: "日本語 (Japanese)" },
  { code: "ko", label: "한국어 (Korean)" },
  { code: "zh", label: "中文 (Chinese)" },
  { code: "tr", label: "Türkçe (Turkish)" },
  { code: "nl", label: "Nederlands (Dutch)" },
  { code: "pl", label: "Polski (Polish)" },
  { code: "id", label: "Indonesia" },
  { code: "ur", label: "اردو (Urdu)" },
  { code: "fa", label: "فارسی (Persian)" },
  { code: "vi", label: "Tiếng Việt (Vietnamese)" },
];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const POSTS_PER_PAGE = 12;
