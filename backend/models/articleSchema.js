const mongoose = require("mongoose");

// ====== Insider Log Schema ======
const articleLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: String,
  scopes: [String],
  method: String,
  path: String,
  ip: String,
  userAgent: String,
  action: String,
});

module.exports = mongoose.model("InsiderLog", articleLogSchema);
