const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { requireAuth, hasScopes } = require("./middleware/auth");
const articleDB = require("./db/article");

const generateId = () => {
  return crypto.randomBytes(6).toString("hex");
};

module.exports = router;
