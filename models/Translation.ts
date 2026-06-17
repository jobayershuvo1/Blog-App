import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface ITranslation extends Document {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  language: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const translationSchema = new Schema<ITranslation>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    language: { type: String, required: true },
    title: String,
    content: String,
  },
  { timestamps: true }
);

// One cached translation per post per language.
translationSchema.index({ post: 1, language: 1 }, { unique: true });

const Translation =
  (models.Translation as Model<ITranslation>) ||
  model<ITranslation>("Translation", translationSchema);
export default Translation;
