import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnswerSnapshot {
  questionId: string;
  key: string;
  label: string;
  type: string;
  options?: { label: string; value: string }[];
  value: any;
}

export interface IStatusHistory {
  from: string;
  to: string;
  userId: mongoose.Types.ObjectId;
  at: Date;
}

export interface INote {
  text: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ICommunication {
  type: "EMAIL" | "WHATSAPP";
  outcome: "NO_REPLY" | "REPLIED" | "WRONG_NUMBER" | "CALL_BOOKED" | "OTHER";
  note?: string;
  message: string;
  userId: mongoose.Types.ObjectId;
  at: Date;
}

export interface IActivityLog {
  type: "CREATED" | "STATUS_CHANGED" | "ASSIGNED" | "NOTE_ADDED" | "COMMUNICATED" | "UPDATED";
  detail: string;
  userId?: mongoose.Types.ObjectId;
  at: Date;
}

export interface IInquiry extends Document {
  referenceId: string;
  idempotencyKey: string;
  formVersionId: mongoose.Types.ObjectId;
  serviceSlug: string;
  projectType?: string;
  contact: {
    name: string;
    company?: string;
    email: string;
    whatsapp: string; // E.164 formatted
    country: string;
    preferredContact: "WHATSAPP" | "EMAIL" | "PHONE";
    preferredTime?: string;
    message?: string;
  };
  consent: {
    accepted: boolean;
    at: Date;
  };
  answers: IAnswerSnapshot[];
  status: "NEW" | "CONTACTED" | "IN_DISCUSSION" | "PROPOSAL_SENT" | "CONVERTED" | "REJECTED";
  assignedTo?: mongoose.Types.ObjectId;
  statusHistory: IStatusHistory[];
  notes: INote[];
  communications: ICommunication[];
  activity: IActivityLog[];
  searchFields: {
    nameLower: string;
    companyLower: string;
    emailLower: string;
    whatsappDigits: string;
    referenceIdLower: string;
  };
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    formVersionId: {
      type: Schema.Types.ObjectId,
      ref: "FormVersion",
      required: true,
    },
    serviceSlug: {
      type: String,
      required: true,
    },
    projectType: {
      type: String,
    },
    contact: {
      name: { type: String, required: true, trim: true },
      company: { type: String, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      whatsapp: { type: String, required: true, trim: true },
      country: { type: String, default: "IN" },
      preferredContact: {
        type: String,
        enum: ["WHATSAPP", "EMAIL", "PHONE"],
        default: "WHATSAPP",
      },
      preferredTime: { type: String },
      message: { type: String },
    },
    consent: {
      accepted: { type: Boolean, required: true },
      at: { type: Date, default: Date.now },
    },
    answers: [
      {
        questionId: { type: String, required: true },
        key: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, required: true },
        options: [{ label: String, value: String }],
        value: { type: Schema.Types.Mixed },
      },
    ],
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "IN_DISCUSSION", "PROPOSAL_SENT", "CONVERTED", "REJECTED"],
      default: "NEW",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    statusHistory: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        at: { type: Date, default: Date.now },
      },
    ],
    notes: [
      {
        text: { type: String, required: true, maxlength: 2000 },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    communications: [
      {
        type: { type: String, enum: ["EMAIL", "WHATSAPP"], required: true },
        outcome: {
          type: String,
          enum: ["NO_REPLY", "REPLIED", "WRONG_NUMBER", "CALL_BOOKED", "OTHER"],
          required: true,
        },
        note: { type: String, maxlength: 1000 },
        message: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        at: { type: Date, default: Date.now },
      },
    ],
    activity: [
      {
        type: {
          type: String,
          enum: ["CREATED", "STATUS_CHANGED", "ASSIGNED", "NOTE_ADDED", "COMMUNICATED", "UPDATED"],
          required: true,
        },
        detail: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],
    searchFields: {
      nameLower: { type: String, lowercase: true, trim: true },
      companyLower: { type: String, lowercase: true, trim: true },
      emailLower: { type: String, lowercase: true, trim: true },
      whatsappDigits: { type: String, trim: true },
      referenceIdLower: { type: String, lowercase: true, trim: true },
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Explicit indexes for search fields (Change #1: case-insensitive anchored regex on lowercase fields)
InquirySchema.index({ "searchFields.nameLower": 1 });
InquirySchema.index({ "searchFields.companyLower": 1 });
InquirySchema.index({ "searchFields.emailLower": 1 });
InquirySchema.index({ "searchFields.whatsappDigits": 1 });
InquirySchema.index({ "searchFields.referenceIdLower": 1 });

// Filtering & sorting indexes
InquirySchema.index({ status: 1, createdAt: -1 });
InquirySchema.index({ serviceSlug: 1, createdAt: -1 });
InquirySchema.index({ assignedTo: 1, status: 1 });
InquirySchema.index({ isDemo: 1, createdAt: -1 });

export const Inquiry: Model<IInquiry> =
  mongoose.models.Inquiry || mongoose.model<IInquiry>("Inquiry", InquirySchema);
