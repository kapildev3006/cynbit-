import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestionOption {
  label: string;
  value: string;
}

export interface IQuestionValidation {
  min?: number;
  max?: number;
  maxLength?: number;
}

export interface IQuestionCondition {
  questionId: string; // Must refer to an earlier question in the order
  equals: string | number | boolean;
}

export interface IFormField {
  id: string; // Server-generated stable ID (e.g. q_xxx)
  key: string; // Machine identifier (e.g. project_description)
  label: string;
  step: 2 | 3; // Step 2 (Requirements) or Step 3 (Planning)
  helpText?: string;
  placeholder?: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "url"
    | "date"
    | "select"
    | "radio"
    | "checkbox";
  required: boolean;
  active: boolean;
  order: number;
  serviceSlugs: string[]; // ["all"] or specific service slugs
  options?: IQuestionOption[];
  validation?: IQuestionValidation;
  visibleIf?: IQuestionCondition;
}

export interface IFormVersion extends Document {
  versionNumber: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  questions: IFormField[];
  publishedAt?: Date;
  publishedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormField>(
  {
    id: { type: String, required: true },
    key: { type: String, required: true },
    label: { type: String, required: true, maxlength: 300 },
    step: { type: Number, enum: [2, 3], required: true },
    helpText: { type: String, maxlength: 500 },
    placeholder: { type: String, maxlength: 200 },
    type: {
      type: String,
      enum: ["text", "textarea", "number", "email", "url", "date", "select", "radio", "checkbox"],
      required: true,
    },
    required: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, required: true },
    serviceSlugs: [{ type: String }],
    options: [
      {
        label: { type: String, required: true, maxlength: 200 },
        value: { type: String, required: true, maxlength: 200 },
      },
    ],
    validation: {
      min: Number,
      max: Number,
      maxLength: Number,
    },
    visibleIf: {
      questionId: String,
      equals: Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const FormVersionSchema = new Schema<IFormVersion>(
  {
    versionNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      required: true,
    },
    questions: [FormFieldSchema],
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Partial unique indexes to strictly enforce at most one PUBLISHED and one DRAFT version
FormVersionSchema.index(
  { status: 1 },
  { name: "uniq_published_status", unique: true, partialFilterExpression: { status: "PUBLISHED" } }
);

FormVersionSchema.index(
  { status: 1 },
  { name: "uniq_draft_status", unique: true, partialFilterExpression: { status: "DRAFT" } }
);

export const FormVersion: Model<IFormVersion> =
  mongoose.models.FormVersion ||
  mongoose.model<IFormVersion>("FormVersion", FormVersionSchema);
