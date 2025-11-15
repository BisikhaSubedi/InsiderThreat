const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { requireAuth, hasScopes } = require("./middleware/auth");
const articleDB = require("./db/article");

module.exports = router;
