const { connectMongo } = require("../config/mongo");

async function fetchLogs() {
  const client = await connectMongo();
  const db = client.db("logsdb");
  return db.collection("http_logs").find({}).toArray();
}

module.exports = { fetchLogs };
