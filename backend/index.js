const express = require("express");
const cors = require("cors");
require("dotenv").config();

const apiRouter = require("./api");
const httpLogger = require("./routes/httpLogger");
const articleLogger = require("./routes/articleLogger");
const emailLogger = require("./routes/emailLogger");
//const ArticleLogger = require("./routes/ArticleLogger");

const app = express();
const port = process.env.PORT || 3000;

//SMTP Configuration
const { verifyTransport } = require("./utils/sendEmailSmtp");
verifyTransport().catch(() => {});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRouter);

// Basic route
app.get("/", (_, res) => {
  res.json({ message: "Welcome to our content management system!" });
});

// http route
app.use("/api", httpLogger);

// article route
app.use("/api", articleLogger);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
