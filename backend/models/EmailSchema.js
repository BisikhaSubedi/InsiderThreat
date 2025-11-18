// models/Email.js
const mongoose = require("mongoose");

const RecipientSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    name: { type: String },
  },
  { _id: false }
);

const EmailSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    from: { type: String, required: true },
    to: { type: [RecipientSchema], default: [] },
    cc: { type: [RecipientSchema], default: [] },
    bcc: { type: [RecipientSchema], default: [] },
    subject: { type: String },
    body: { type: String }, // html or text
    provider: { type: String, default: "smtp" },
    providerResponse: { type: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      enum: ["sent", "failed", "queued"],
      default: "sent",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "email_logs" }
);

module.exports = mongoose.model("Email", EmailSchema);
