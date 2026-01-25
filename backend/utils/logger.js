const {v4: uuidv4} = require('uuid');
const os = require("os");

const HttpLog = require('../models/httpLogSchema')

const getClientIp = (req) => {
  return (req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '').split(',')[0].trim();
}

const isPublicIP = (ip) => {
  const parts = ip.split(".").map(Number);

  const [a, b] = parts;

  // Private ranges
  if (a === 10) return false;                         // 10.0.0.0 – 10.255.255.255
  if (a === 172 && b >= 16 && b <= 31) return false;   // 172.16.0.0 – 172.31.255.255
  if (a === 192 && b === 168) return false;            // 192.168.0.0 – 192.168.255.255

  // Loopback
  if (a === 127) return false;

  // Link-local / APIPA
  if (a === 169 && b === 254) return false;

  return true;
}

const generateRandomPublicIP = () => {
  while (true) {
    const ip = [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ].join(".");

    // Exclude private, reserved and local ranges
    if (isPublicIP(ip)) {
      return ip;
    }
  }
}

const getServerIP = () => {
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal (127.0.0.1) and non-IPv4
      if (net.family === "IPv4") {
        return net.address;
      }
    }
  }
}

const getClientOS = (userAgent) => {
  if (/windows nt/i.test(userAgent)) return "Windows";
  if (/mac os x/i.test(userAgent)) return "macOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown";
}

const requestLogger = async (req, res) => {

  let bytesSent = 0;

  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function (chunk, ...args) {
    if (chunk) {
      bytesSent += Buffer.byteLength(chunk);
    }
    return originalWrite.apply(res, [chunk, ...args]);
  };

  res.end = function (chunk, ...args) {
    if (chunk) {
      bytesSent += Buffer.byteLength(chunk);
    }
    return originalEnd.apply(res, [chunk, ...args]);
  };

  res.on("finish", () => {
    const soruceIp = generateRandomPublicIP();
    const doc = new HttpLog({
    id: uuidv4(),
    date: new Date(),
    user: req.user.id,
    pc: getClientOS(req.get('User-Agent') || ""),
    url: req.originalUrl.replace("localhost", soruceIp).replace("127.0.0.1", soruceIp),
    method: req.method,
    referrer: (req.get("referer") || req.get("origin")).replace("localhost", soruceIp).replace("127.0.0.1", soruceIp),
    user_agent: req.get('User-Agent'),
    src_ip: generateRandomPublicIP() || getClientIp(req),
    dst_ip: getServerIP(),
    response_code: res.statusCode,
    bytes: bytesSent,
  });
  
  doc.save();
  });
};

module.exports = {
  requestLogger
};
