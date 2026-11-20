import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessageTemplate extends Document {
  name: string;
  channel: "EMAIL" | "WHATSAPP";
  subject?: string;
  body: string;
  serviceSlug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageTemplateSchema = new Schema<IMessageTemplate>(
  {
    name: { type: String, required: true, trim: true },
    channel: { type: String, enum: ["EMAIL", "WHATSAPP"], required: true },
    subject: { type: String },
    body: { type: String, required: true },
    serviceSlug: { type: String },
  },
  { timestamps: true }
);

MessageTemplateSchema.index({ channel: 1, serviceSlug: 1 });

export const MessageTemplate: Model<IMessageTemplate> =
  mongoose.models.MessageTemplate ||
  mongoose.model<IMessageTemplate>("MessageTemplate", MessageTemplateSchema);
