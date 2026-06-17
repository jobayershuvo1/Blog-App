import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/constants";

function resolveLocale(): Locale {
  // 1) explicit cookie preference
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value as Locale | undefined;
  if (cookieLocale && LOCALES.includes(cookieLocale)) return cookieLocale;

  // 2) Accept-Language header
  const accept = headers().get("accept-language") || "";
  const preferred = accept.split(",")[0]?.split("-")[0] as Locale | undefined;
  if (preferred && LOCALES.includes(preferred)) return preferred;

  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = resolveLocale();
  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});
