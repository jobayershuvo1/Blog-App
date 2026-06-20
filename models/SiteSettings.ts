import { Schema, model, models, type Model, type Document } from "mongoose";

export interface ISiteSettings extends Document {
  key: string; // singleton key, always "global"
  siteName: string;
  tagline: string;
  logo?: string;
  favicon?: string;
  social: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    linkedin?: string;
  };
  gaId?: string;
  ads: {
    header?: string;
    sidebar?: string;
    inArticle?: string;
  };
  adsense: {
    enabled: boolean;
    publisherId?: string; // ca-pub-XXXXXXXXXXXXXXXX
    autoAds: boolean;
    paragraphsPerAd: number;
    slots: {
      header?: string;
      sidebar?: string;
      footer?: string;
      inArticle?: string;
      stickyMobile?: string;
    };
  };
  homepageLayout: "grid" | "list" | "magazine";
  footerText: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  updatedAt: Date;
}

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, default: "global", unique: true, index: true },
    siteName: { type: String, default: "BlogForge" },
    tagline: { type: String, default: "Stories worth sharing." },
    logo: String,
    favicon: String,
    social: {
      twitter: String,
      facebook: String,
      instagram: String,
      youtube: String,
      github: String,
      linkedin: String,
    },
    gaId: String,
    ads: {
      header: String,
      sidebar: String,
      inArticle: String,
    },
    adsense: {
      enabled: { type: Boolean, default: false },
      publisherId: String,
      autoAds: { type: Boolean, default: false },
      paragraphsPerAd: { type: Number, default: 3 },
      slots: {
        header: String,
        sidebar: String,
        footer: String,
        inArticle: String,
        stickyMobile: String,
      },
    },
    homepageLayout: { type: String, enum: ["grid", "list", "magazine"], default: "magazine" },
    footerText: { type: String, default: "Built with ❤️ using Next.js & MongoDB." },
    colors: {
      primary: { type: String, default: "#6366f1" },
      secondary: { type: String, default: "#8b5cf6" },
      accent: { type: String, default: "#f59e0b" },
    },
  },
  { timestamps: true }
);

const SiteSettings =
  (models.SiteSettings as Model<ISiteSettings>) ||
  model<ISiteSettings>("SiteSettings", siteSettingsSchema);
export default SiteSettings;

/** Fetch (or lazily create) the singleton settings document, as a plain object. */
export async function getSettings() {
  const existing = await SiteSettings.findOne({ key: "global" }).lean();
  if (existing) return existing;
  const created = await SiteSettings.create({ key: "global" });
  return created.toObject();
}
