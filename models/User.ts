import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import { ROLES, USER_STATUS } from "@/lib/constants";

export interface SocialLinks {
  website?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: string;
  avatar?: string;
  bio?: string;
  socialLinks?: SocialLinks;
  status: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const socialSchema = new Schema<SocialLinks>(
  {
    website: String,
    twitter: String,
    facebook: String,
    linkedin: String,
    github: String,
    instagram: String,
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    username: { type: String, unique: true, sparse: true, trim: true, index: true },
    // select:false → never returned unless explicitly requested
    password: { type: String, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.READER,
      index: true,
    },
    avatar: String,
    bio: { type: String, maxlength: 1000 },
    socialLinks: { type: socialSchema, default: {} },
    status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE, index: true },
    resetToken: { type: String, select: false, index: true },
    resetTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

const User = (models.User as Model<IUser>) || model<IUser>("User", userSchema);
export default User;
