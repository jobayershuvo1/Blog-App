import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface INewsletterSubscriber extends Document {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  status: "subscribed" | "unsubscribed";
  createdAt: Date;
  updatedAt: Date;
}

const subscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: String,
    status: { type: String, enum: ["subscribed", "unsubscribed"], default: "subscribed" },
  },
  { timestamps: true }
);

const NewsletterSubscriber =
  (models.NewsletterSubscriber as Model<INewsletterSubscriber>) ||
  model<INewsletterSubscriber>("NewsletterSubscriber", subscriberSchema);
export default NewsletterSubscriber;
