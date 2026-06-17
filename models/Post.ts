import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import { POST_STATUS } from "@/lib/constants";

export interface DownloadLink {
  label: string;
  url: string;
  fileType: string; // pdf, zip, exe, doc, img, other
  downloads: number;
}

export interface IPost extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: string; // HTML from TipTap
  excerpt?: string;
  coverImage?: string;
  author: Types.ObjectId;
  category?: Types.ObjectId;
  tags: string[];
  status: string;
  featured: boolean;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  downloadLinks: DownloadLink[];
  views: number;
  shares: number;
  rejectionReason?: string;
  approvedBy?: Types.ObjectId;
  publishedAt?: Date;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const downloadLinkSchema = new Schema<DownloadLink>(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, default: "other" },
    downloads: { type: Number, default: 0 },
  },
  { _id: false }
);

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String, maxlength: 400 },
    coverImage: String,
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    tags: { type: [String], default: [], index: true },
    status: {
      type: String,
      enum: Object.values(POST_STATUS),
      default: POST_STATUS.DRAFT,
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    metaTitle: { type: String, maxlength: 70 },
    metaDescription: { type: String, maxlength: 200 },
    focusKeyword: String,
    downloadLinks: { type: [downloadLinkSchema], default: [] },
    views: { type: Number, default: 0, index: true },
    shares: { type: Number, default: 0 },
    rejectionReason: String,
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedAt: Date,
    scheduledAt: Date,
  },
  { timestamps: true }
);

// Compound indexes for common queries.
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ category: 1, status: 1, publishedAt: -1 });
postSchema.index({ author: 1, status: 1, createdAt: -1 });
// Full-text search across title/content/tags.
postSchema.index({ title: "text", content: "text", tags: "text" });

const Post = (models.Post as Model<IPost>) || model<IPost>("Post", postSchema);
export default Post;
