const { MongoClient } = require("mongodb");

const client = new MongoClient("mongodb://localhost:27017");

// async function connectMongo() {
//   if (!client.topology?.isConnected()) {
//     await client.connect();
//   }
//   return client;
// }

// module.exports = { connectMongo };
