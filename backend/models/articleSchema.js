const mongoose = require("mongoose");

// ====== Insider Log Schema ======
const insiderLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: String,
  scopes: [String],
  method: String,
  path: String,
  ip: String,
  userAgent: String,
  action: String,
});

const InsiderLog = mongoose.model("InsiderLog", insiderLogSchema);
