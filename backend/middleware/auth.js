const { createRemoteJWKSet, jwtVerify } = require("jose");
const mongoose = require("mongoose");

// ====== MongoDB Connection (only once in your app) ======
if (!mongoose.connection.readyState) {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ Connected to MongoDB for insider logs"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

// ====== Helper Functions ======
const getTokenFromHeader = (headers) => {
  const { authorization } = headers;
  const bearerTokenIdentifier = "Bearer";

  if (!authorization) {
    throw new Error("Authorization header missing");
  }

  if (!authorization.startsWith(bearerTokenIdentifier)) {
    throw new Error("Authorization token type not supported");
  }

  return authorization.slice(bearerTokenIdentifier.length + 1);
};

const hasScopes = (tokenScopes, requiredScopes) => {
  if (!requiredScopes || requiredScopes.length === 0) {
    return true;
  }
  const scopeSet = new Set(tokenScopes);
  return requiredScopes.every((scope) => scopeSet.has(scope));
};

const verifyJwt = async (token) => {
  const JWKS = createRemoteJWKSet(new URL(process.env.LOGTO_JWKS_URL));

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: process.env.LOGTO_ISSUER,
    audience: process.env.LOGTO_API_RESOURCE,
  });
  console.log("payload:", payload);
  return payload;
};

// ====== Auth Middleware with MongoDB Logging ======
const requireAuth = (requiredScopes = []) => {
  return async (req, res, next) => {
    try {
      // Extract the token
      const token = getTokenFromHeader(req.headers);

      // Verify the token
      const payload = await verifyJwt(token);
      // Add user info to request
      req.user = {
        id: payload.sub,
        scopes: payload.scope?.split(" ") || [],
      };

      // Verify required scopes
      if (!hasScopes(req.user.scopes, requiredScopes)) {
        throw new Error("Insufficient permissions");
      }
      // 🔹 Capture insider log into MongoDB
      await InsiderLog.create({
        userId: req.user.id,
        scopes: req.user.scopes,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        action: "API Request",
      });

      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized" });
    }
  };
};

module.exports = {
  requireAuth,
  hasScopes,
};
