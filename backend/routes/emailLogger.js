// routes/emailLogger.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const Email = require("../models/EmailSchema");

/**
 * 
 * Extracts the client’s IP address from Express request headers.
    Supports direct IP, proxy (x-forwarded-for), and connection fallback.
    Always returns the first valid IP after trimming.
 */
function getClientIp(req) {
  return (
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    ""
  )
    .split(",")[0]
    .trim();
}

/**
 * Helper: normalize recipients input into array of { address, name? }
 * Acceptable inputs:
 *  - string: "alice@example.com; bob@example.com"
 *  - string with names: "Alice <alice@example.com>, Bob <bob@example.com>"
 *  - array: ["alice@example.com", { address: "...", name: "..." }, ...]
 */
function normalizeRecipients(input) {
  if (!input) return [];

  // If already array of objects/strings
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return { address: item.trim() };
        if (typeof item === "object" && item.address)
          return { address: String(item.address).trim(), name: item.name };
        return null;
      })
      .filter(Boolean);
  }

  // If string, split by semicolon or comma
  if (typeof input === "string") {
    // split by semicolon or comma, but prefer semicolon first
    const parts = input
      .split(/[;,]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.map((p) => {
      // try to extract name + email like: Name <email@domain>
      const match = p.match(/^(.*)<(.+@.+\..+)>$/);
      if (match) {
        return {
          address: match[2].trim(),
          name: match[1].trim().replace(/(^"|"$)/g, ""),
        };
      }
      return { address: p };
    });
  }

  // unknown type
  return [];
}

/**
 * Main route that receives new email logs via POST requests.
    Validates required fields (user, from, to), normalizes recipients, and prepares the log document.
    Saves the email record into MongoDB and returns the saved log.
 */
router.post("/email", async (req, res) => {
  try {
    const {
      id,
      date,
      user,
      pc,
      from, // sender email address (CSV 'from')
      to, // recipients: string or array
      cc,
      bcc,
      subject,
      attachment, // boolean or truthy value
      attachments, // optional detailed attachments array [{ filename, contentType, size }]
      size, // size in bytes
      raw_to,
      raw_cc,
      raw_bcc,
      message_id,
      thread_id,
      raw, // any raw/original CSV row if provided
    } = req.body;

    // Basic validation (adjust as you prefer)
    if (!user || !from || !to) {
      return res
        .status(400)
        .json({ error: "user, from and to fields are required" });
    }

    /**
     * Persists the email log into the MongoDB email collection.
        Returns the saved document if successful.
        Throws an error if validation fails or the ID conflicts.
     */
    const emailDoc = new Email({
      id: id || uuidv4(),
      date: date ? new Date(date) : new Date(),
      user,
      pc,
      from,
      to: normalizeRecipients(to),
      cc: normalizeRecipients(cc),
      bcc: normalizeRecipients(bcc),
      subject: subject || "",
      // determine boolean attachment from either boolean input or attachments array
      attachment:
        typeof attachment === "boolean"
          ? attachment
          : Array.isArray(attachments) && attachments.length > 0,
      attachments: Array.isArray(attachments)
        ? attachments.map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            size: a.size !== undefined ? Number(a.size) : undefined,
          }))
        : [],
      size: size !== undefined ? Number(size) : undefined,
      raw_to: raw_to || (typeof to === "string" ? to : undefined),
      raw_cc: raw_cc || (typeof cc === "string" ? cc : undefined),
      raw_bcc: raw_bcc || (typeof bcc === "string" ? bcc : undefined),
      message_id,
      thread_id,
      raw: raw || {},
    });

    await emailDoc.save();
    return res.status(201).json({ ok: true, email: emailDoc });
  } catch (err) {
    console.error("Error saving email log:", err);
    // handle duplicate id gracefully
    if (err.code === 11000) {
      return res.status(409).json({ error: "duplicate id" });
    }
    return res.status(500).json({ error: "failed to save email log" });
  }
});

module.exports = router;
