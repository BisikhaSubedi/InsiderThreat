const { fetchLogs } = require("../services/log.service");

async function getLogs(req, res) {
  const logs = await fetchLogs();
  res.json(logs);
}

module.exports = { getLogs };
