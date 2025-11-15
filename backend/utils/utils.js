// utils/utils.js
const crypto = require("crypto");

const generateId = () => {
  return crypto.randomBytes(6).toString("hex"); // 12-char ID
};

module.exports = generateId;
