import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import { REQUEST_STATUS } from "@/lib/constants";
import type { SocialLinks } from "./User";

export interface IAuthorRequest extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string; // already hashed
  bio: string;
  socialLinks?: SocialLinks;
  writingSample?: string;
  status: string;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const authorRequestSchema = new Schema<IAuthorRequest>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    bio: { type: String, required: true, maxlength: 2000 },
    socialLinks: {
      website: String,
      twitter: String,
      facebook: String,
      linkedin: String,
      github: String,
      instagram: String,
    },
    writingSample: { type: String, maxlength: 10000 },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
      index: true,
    },
    rejectionReason: String,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

const AuthorRequest =
  (models.AuthorRequest as Model<IAuthorRequest>) ||
  model<IAuthorRequest>("AuthorRequest", authorRequestSchema);
export default AuthorRequest;
