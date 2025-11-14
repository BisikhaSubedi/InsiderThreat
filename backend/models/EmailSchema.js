// models/Email.js
const mongoose = require("mongoose");

const RecipientSchema = new mongoose.Schema(
  {
    address: { type: String, required: true }, // recipient email address
    name: { type: String }, // optional display name
  },
  { _id: false }
);

const AttachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    contentType: { type: String },
    size: { type: Number }, // bytes
  },
  { _id: false }
);

const EmailSchema = new mongoose.Schema(
  {
    // a custom unique id for the record (uuid/hex). Keep as string to match CSV id field.
    id: { type: String, required: true, unique: true },

    // timestamp when the email was sent (as in the CSV 'date' column)
    date: { type: Date, required: true, default: Date.now },

    // sending user (username / userid)
    user: { type: String, required: true, index: true },

    // workstation / pc name used to send the email
    pc: { type: String },

    // sender email address (CSV 'from' column)
    from: { type: String, required: true, match: /.+@.+\..+/ },

    // recipients (CSV 'to', stored as array for easy querying)
    to: { type: [RecipientSchema], default: [] },

    // CC recipients (CSV 'cc')
    cc: { type: [RecipientSchema], default: [] },

    // BCC recipients (CSV 'bcc') — keep as array but may be empty/omitted
    bcc: { type: [RecipientSchema], default: [] },

    // subject line (CSV 'subject')
    subject: { type: String, default: "" },

    // whether the email had an attachment (CSV 'attachment' boolean)
    attachment: { type: Boolean, default: false },

    // detailed attachments (filenames, sizes) if available
    attachments: { type: [AttachmentSchema], default: [] },

    // size of the email in bytes (CSV 'size')
    size: { type: Number, default: 0 },

    // original raw recipients string (useful if you want to keep the exact CSV text)
    raw_to: { type: String },
    raw_cc: { type: String },
    raw_bcc: { type: String },

    // optional message id or thread id if available
    message_id: { type: String },
    thread_id: { type: String },
  },
  {
    collection: "email",
    // keep createdAt/updatedAt for ingestion metadata
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Text index on subject to allow fast text search over subject lines
EmailSchema.index({ subject: "text" });

// Compound index for common queries (user + date range)
EmailSchema.index({ user: 1, date: -1 });

// Helper virtual: flat lists of recipient addresses
EmailSchema.virtual("to_addresses").get(function () {
  return (this.to || []).map((r) => r.address);
});
EmailSchema.virtual("cc_addresses").get(function () {
  return (this.cc || []).map((r) => r.address);
});
EmailSchema.virtual("bcc_addresses").get(function () {
  return (this.bcc || []).map((r) => r.address);
});

// If you want to transform the document before sending to clients (optional)
EmailSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    // remove internal mongo _id by default (optional)
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Email", EmailSchema);
