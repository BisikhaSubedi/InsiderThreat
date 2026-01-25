const express = require("express");
const cors = require("cors");
require("dotenv").config();

// const apiRouter = require("./api");
const articleLogger = require("./routes/articleLogger");
// const httpLogger = require("./routes/httpLogger");
// const emailLogger = require("./routes/emailLogger");
//const ArticleLogger = require("./routes/ArticleLogger");

const app = express();
const port = process.env.PORT || 3000;

//SMTP Configuration
const { verifyTransport } = require("./utils/sendEmailSmtp");
verifyTransport().catch(() => {});

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get("/", (_, res) => {
  res.json({ message: "Welcome to our content management system!" });
});

// API Routes
// app.use("/api", apiRouter);

// http route
// app.use("/api", httpLogger);

// article route
app.use("/api", articleLogger);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
