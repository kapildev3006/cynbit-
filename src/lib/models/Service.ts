import mongoose, { Schema, Document, Model } from "mongoose";

export interface IService extends Document {
  slug: string;
  name: string;
  category: "AI_AUTOMATION" | "CUSTOM_IT" | "DIGITAL_MARKETING";
  description: string;
  features: string[];
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["AI_AUTOMATION", "CUSTOM_IT", "DIGITAL_MARKETING"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    features: [{ type: String }],
    active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index for category listings and active ordering
ServiceSchema.index({ category: 1, active: 1, order: 1 });

export const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);
