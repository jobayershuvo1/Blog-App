import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface IMessage extends Document {
  _id: Types.ObjectId;
  from: Types.ObjectId;
  to: Types.ObjectId;
  subject: string;
  body: string;
  isRead: boolean;
  threadId: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    threadId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const Message = (models.Message as Model<IMessage>) || model<IMessage>("Message", messageSchema);
export default Message;
