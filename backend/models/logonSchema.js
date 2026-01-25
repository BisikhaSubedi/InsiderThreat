// models/Logon.js
const mongoose = require('mongoose');

const LogonSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },    // custom id (uuid/hex)
  date: { type: Date, required: true, default: Date.now },// timestamp
  user: { type: String, required: true },                // username / userid
  pc: { type: String, required: true },                  // pc name or host
  ip: { type: String, required: true },                  // client IP
  activity: { type: String, required: true }             // Logon / Logoff / other
}, {
  collection: 'logon' // optional: exact collection name
});

module.exports = mongoose.model('Logon', LogonSchema);
