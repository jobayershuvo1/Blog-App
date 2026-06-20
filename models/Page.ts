import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface IPage extends Document {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  content: string; // HTML
  metaDescription?: string;
  published: boolean;
  isSystem: boolean; // seeded compliance pages
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const pageSchema = new Schema<IPage>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    metaDescription: { type: String, maxlength: 200 },
    published: { type: Boolean, default: true, index: true },
    isSystem: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Page = (models.Page as Model<IPage>) || model<IPage>("Page", pageSchema);
export default Page;
