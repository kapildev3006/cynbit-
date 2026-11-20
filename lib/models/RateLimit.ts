import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRateLimit extends Document {
  ipHash: string;
  count: number;
  createdAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    ipHash: { type: String, required: true, unique: true, index: true },
    count: { type: Number, default: 1 },
    createdAt: {
      type: Date,
      default: Date.now,
      // MongoDB TTL Index: documents automatically expire after 60 seconds
      expires: 60,
    },
  },
  {
    collection: "rate_limits",
  }
);

export const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
