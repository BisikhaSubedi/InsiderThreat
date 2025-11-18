// utils/sendEmailSmtp.js
const nodemailer = require("nodemailer");
const generateId = require("../utils/utils"); // adjust path if your generateId export differs
const EmailLog = require("../models/EmailSchema");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true", // true if using 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Optional: verify transporter during startup (won't throw in production if not called)
async function verifyTransport() {
  try {
    await transporter.verify();
    console.log("SMTP transporter verified");
  } catch (err) {
    console.warn("SMTP transporter verification failed:", err.message || err);
  }
}

async function sendEmailAndLog({
  from,
  to = [],
  cc = [],
  bcc = [],
  subject,
  html,
  text,
}) {
  const id = generateId();
  const mailOptions = {
    from,
    to: to.map((r) => (typeof r === "string" ? r : r.address)).join(","),
    cc: cc.length
      ? cc.map((r) => (typeof r === "string" ? r : r.address)).join(",")
      : undefined,
    bcc: bcc.length
      ? bcc.map((r) => (typeof r === "string" ? r : r.address)).join(",")
      : undefined,
    subject,
    html,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // log success
    const emailDoc = await EmailLog.create({
      id,
      from,
      to: (to || []).map((x) => (typeof x === "string" ? { address: x } : x)),
      cc: (cc || []).map((x) => (typeof x === "string" ? { address: x } : x)),
      bcc: (bcc || []).map((x) => (typeof x === "string" ? { address: x } : x)),
      subject,
      body: html || text,
      provider: "smtp",
      providerResponse: info,
      status: "sent",
    });
    return { ok: true, emailDoc, info };
  } catch (err) {
    // log failure
    const emailDoc = await EmailLog.create({
      id,
      from,
      to: (to || []).map((x) => (typeof x === "string" ? { address: x } : x)),
      cc: (cc || []).map((x) => (typeof x === "string" ? { address: x } : x)),
      bcc: (bcc || []).map((x) => (typeof x === "string" ? { address: x } : x)),
      subject,
      body: html || text,
      provider: "smtp",
      providerResponse: { error: err.message, details: err.response || null },
      status: "failed",
    });
    return { ok: false, emailDoc, error: err };
  }
}

module.exports = {
  sendEmailAndLog,
  verifyTransport,
};
