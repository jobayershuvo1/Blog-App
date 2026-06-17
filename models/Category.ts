import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  coverImage?: string;
  postCount: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, maxlength: 500 },
    color: { type: String, default: "#6366f1" },
    icon: { type: String, default: "📝" },
    coverImage: String,
    postCount: { type: Number, default: 0 },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

const Category =
  (models.Category as Model<ICategory>) || model<ICategory>("Category", categorySchema);
export default Category;
