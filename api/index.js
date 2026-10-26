"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server/vercel-handler.ts
var vercel_handler_exports = {};
__export(vercel_handler_exports, {
  default: () => handler
});
module.exports = __toCommonJS(vercel_handler_exports);

// src/server/app.ts
var import_express6 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_cookie_parser = __toESM(require("cookie-parser"));
var import_path3 = __toESM(require("path"));
var import_fs4 = __toESM(require("fs"));
var import_crypto4 = __toESM(require("crypto"));
var import_client2 = require("@prisma/client");

// src/server/routes/auth.ts
var import_express = require("express");
var import_bcryptjs = __toESM(require("bcryptjs"));

// src/shared/schemas.ts
var import_zod = require("zod");
var RegisterSchema = import_zod.z.object({
  name: import_zod.z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name cannot exceed 80 characters"),
  email: import_zod.z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: import_zod.z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long")
});
var LoginSchema = import_zod.z.object({
  email: import_zod.z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: import_zod.z.string().min(1, "Password is required")
});
var ComplaintCreateSchema = import_zod.z.object({
  title: import_zod.z.string().trim().min(5, "Title must be at least 5 characters").max(120, "Title cannot exceed 120 characters"),
  description: import_zod.z.string().trim().min(15, "Please provide more details (at least 15 characters)").max(3e3, "Description cannot exceed 3000 characters"),
  address: import_zod.z.string().trim().min(5, "Please provide a specific street address or landmark (at least 5 characters)").max(200, "Address cannot exceed 200 characters"),
  serviceAreaId: import_zod.z.string().min(1, "Please select a valid service area"),
  firstNoticedDate: import_zod.z.string().optional().nullable()
});
var StatusUpdateSchema = import_zod.z.object({
  toStatus: import_zod.z.enum(["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"]),
  note: import_zod.z.string().trim().max(1e3, "Note cannot exceed 1000 characters").optional().nullable(),
  isCitizenVisible: import_zod.z.boolean().default(true),
  explanation: import_zod.z.string().trim().max(1e3).optional()
}).refine((data) => {
  if (data.toStatus === "RESOLVED") {
    return !!data.note && data.note.trim().length >= 5;
  }
  return true;
}, {
  message: "A detailed resolution note (at least 5 characters) is required before resolving a complaint",
  path: ["note"]
});
var FlagForReviewSchema = import_zod.z.object({
  reason: import_zod.z.string().trim().min(10, "Please provide an explanation (at least 10 characters) for flagging this complaint").max(1e3)
});
var ManualReviewDecisionSchema = import_zod.z.object({
  categoryId: import_zod.z.string().min(1, "Please select a valid category"),
  departmentId: import_zod.z.string().min(1, "Please select a valid department"),
  reviewDecision: import_zod.z.enum(["APPROVED", "REJECTED"]).default("APPROVED"),
  notes: import_zod.z.string().trim().min(5, "Please provide an administrative review rationale").max(1e3)
});
var ScoreOverrideSchema = import_zod.z.object({
  priority: import_zod.z.number().min(0).max(10).optional().nullable(),
  urgency: import_zod.z.number().min(0).max(10).optional().nullable(),
  feasibility: import_zod.z.number().min(0).max(10).optional().nullable(),
  reason: import_zod.z.string().trim().min(10, "A reason for overriding automated scores is required (at least 10 characters)").max(500)
});
var StaffDepartmentAssignSchema = import_zod.z.object({
  userId: import_zod.z.string().min(1, "User ID is required"),
  departmentId: import_zod.z.string().nullable()
});
var ComplaintFilterSchema = import_zod.z.object({
  search: import_zod.z.string().optional(),
  categoryId: import_zod.z.string().optional(),
  departmentId: import_zod.z.string().optional(),
  serviceAreaId: import_zod.z.string().optional(),
  status: import_zod.z.enum(["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "ACTIVE", "ALL"]).optional(),
  reviewState: import_zod.z.enum(["NOT_REQUIRED", "REQUIRED", "APPROVED", "ALL"]).optional(),
  minCoreScore: import_zod.z.coerce.number().min(0).max(10).optional(),
  dateFrom: import_zod.z.string().optional(),
  dateTo: import_zod.z.string().optional(),
  // Colored stars (AND condition)
  starRed: import_zod.z.enum(["true", "false"]).optional(),
  starPink: import_zod.z.enum(["true", "false"]).optional(),
  starOrange: import_zod.z.enum(["true", "false"]).optional(),
  starGreen: import_zod.z.enum(["true", "false"]).optional(),
  // Sorting
  sortBy: import_zod.z.enum(["coreScore", "urgency", "priority", "duration", "feasibility", "newest", "oldest"]).default("coreScore"),
  sortOrder: import_zod.z.enum(["asc", "desc"]).default("desc"),
  page: import_zod.z.coerce.number().int().min(1).default(1),
  limit: import_zod.z.coerce.number().int().min(1).max(100).default(15)
});

// src/server/middleware/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));

// src/server/middleware/csrf.ts
var import_crypto = __toESM(require("crypto"));
var CSRF_COOKIE_NAME = "civic_csrf_token";
var SESSION_COOKIE_NAME = "civic_session";
function generateCsrfToken() {
  return import_crypto.default.randomBytes(24).toString("hex");
}
function setCsrfCookie(res, token) {
  const csrfToken = token || generateCsrfToken();
  const isSecure = process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    // Accessible to client-side JS for X-CSRF-Token header
    secure: isSecure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1e3,
    path: "/"
  });
  return csrfToken;
}
function isAllowedOrigin(originHeader) {
  if (!originHeader) return true;
  if (process.env.NODE_ENV !== "production") {
    if (originHeader.startsWith("http://localhost:") || originHeader.startsWith("http://127.0.0.1:")) {
      return true;
    }
  }
  const additionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) : [];
  const explicitlyAllowed = [
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    ...additionalOrigins
  ].filter(Boolean);
  return explicitlyAllowed.includes(originHeader);
}
function csrfProtection(req, res, next) {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
      setCsrfCookie(res);
    }
    next();
    return;
  }
  const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : void 0);
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({
      success: false,
      error: `Cross-site request blocked: Origin "${origin}" is not authorized.`
    });
    return;
  }
  if (req.headers["sec-fetch-site"] === "cross-site") {
    res.status(403).json({
      success: false,
      error: "Cross-site request blocked by browser fetch metadata policy."
    });
    return;
  }
  const isPublicAuth = req.path === "/api/auth/login" || req.path === "/api/auth/register";
  if (isPublicAuth) {
    next();
    return;
  }
  const hasSessionCookie = Boolean(req.cookies?.[SESSION_COOKIE_NAME]);
  const isBearerAuth = Boolean(req.headers.authorization?.startsWith("Bearer "));
  if (hasSessionCookie && !isBearerAuth) {
    const clientCsrfToken = req.headers["x-csrf-token"];
    const cookieCsrfToken = req.cookies?.[CSRF_COOKIE_NAME];
    if (clientCsrfToken) {
      if (!cookieCsrfToken || clientCsrfToken !== cookieCsrfToken) {
        res.status(403).json({
          success: false,
          error: "Security verification failed: Missing or invalid CSRF token. Please refresh the page and try again."
        });
        return;
      }
    } else if (cookieCsrfToken && (origin || req.headers["sec-fetch-mode"])) {
      res.status(403).json({
        success: false,
        error: "Security verification failed: Missing CSRF token header."
      });
      return;
    }
  }
  next();
}

// src/server/middleware/auth.ts
var FALLBACK_SECRET = "civic-resolve-fallback-secret-2026";
function getJwtSecret() {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === FALLBACK_SECRET || secret.length < 32) {
      throw new Error(
        "CRITICAL AUTH ERROR: A secure, strong JWT_SECRET (at least 32 characters) is strictly required in production."
      );
    }
    return secret;
  }
  return process.env.JWT_SECRET || FALLBACK_SECRET;
}
function assertAuthConfigured() {
  getJwtSecret();
}
var TOKEN_COOKIE_NAME = "civic_session";
function signToken(user) {
  return import_jsonwebtoken.default.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}
function setAuthCookie(res, token) {
  const isSecure = process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1e3,
    // 7 days
    path: "/"
  });
  setCsrfCookie(res);
}
function clearAuthCookie(res) {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}
async function authenticateToken(req, res, next) {
  const token = req.cookies?.[TOKEN_COOKIE_NAME] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (!token) {
    res.status(401).json({ success: false, error: "Authentication required. Please log in." });
    return;
  }
  try {
    const payload = import_jsonwebtoken.default.verify(token, getJwtSecret());
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        department: {
          select: { id: true, name: true, code: true, description: true }
        }
      }
    });
    if (!user) {
      clearAuthCookie(res);
      res.status(401).json({ success: false, error: "User account not found." });
      return;
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      department: user.department,
      createdAt: user.createdAt.toISOString()
    };
    next();
  } catch (err) {
    clearAuthCookie(res);
    res.status(401).json({ success: false, error: "Session expired or invalid. Please log in again." });
  }
}
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: This resource requires one of [${allowedRoles.join(", ")}] permissions. Your role is ${req.user.role}.`
      });
      return;
    }
    next();
  };
}

// src/server/services/audit.ts
async function logAuditEvent(prisma2, params) {
  try {
    return await prisma2.auditEvent.create({
      data: {
        complaintId: params.complaintId || null,
        actorId: params.actorId,
        action: params.action,
        details: JSON.stringify(params.details)
      }
    });
  } catch (err) {
    console.error("[Audit Error] Failed to record audit event:", err);
  }
}

// src/server/services/rateLimit.ts
var memoryStore = /* @__PURE__ */ new Map();
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "127.0.0.1";
}
async function consumeRateLimit(key, maxPoints, windowSeconds) {
  const now = /* @__PURE__ */ new Date();
  const windowMs = windowSeconds * 1e3;
  const newExpiresAt = new Date(now.getTime() + windowMs);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.rateLimitRecord.findUnique({
        where: { key }
      });
      if (!existing || existing.expiresAt < now) {
        const updated = await tx.rateLimitRecord.upsert({
          where: { key },
          create: {
            key,
            points: 1,
            expiresAt: newExpiresAt
          },
          update: {
            points: 1,
            expiresAt: newExpiresAt
          }
        });
        return {
          allowed: true,
          remaining: maxPoints - 1,
          retryAfterSeconds: windowSeconds
        };
      }
      if (existing.points >= maxPoints) {
        const retryAfter = Math.max(1, Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1e3));
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: retryAfter
        };
      }
      const incremented = await tx.rateLimitRecord.update({
        where: { key },
        data: { points: { increment: 1 } }
      });
      return {
        allowed: true,
        remaining: Math.max(0, maxPoints - incremented.points),
        retryAfterSeconds: Math.max(1, Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1e3))
      };
    });
    return result;
  } catch (err) {
    const nowTime = Date.now();
    let mem = memoryStore.get(key);
    if (!mem || mem.expiresAt < nowTime) {
      mem = { points: 1, expiresAt: nowTime + windowMs };
      memoryStore.set(key, mem);
      return { allowed: true, remaining: maxPoints - 1, retryAfterSeconds: windowSeconds };
    }
    if (mem.points >= maxPoints) {
      const retryAfter = Math.max(1, Math.ceil((mem.expiresAt - nowTime) / 1e3));
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }
    mem.points += 1;
    return {
      allowed: true,
      remaining: Math.max(0, maxPoints - mem.points),
      retryAfterSeconds: Math.max(1, Math.ceil((mem.expiresAt - nowTime) / 1e3))
    };
  }
}
function isTestEnvironment() {
  return process.env.NODE_ENV === "test" || process.env.npm_lifecycle_event === "test" || process.env.npm_lifecycle_event === "test:all" || process.env.npm_lifecycle_event === "test:e2e" || process.argv.some((arg) => arg.includes("--test"));
}
function rateLimiter(options) {
  const { prefix, maxPoints, windowSeconds, message, keyGenerator } = options;
  return async (req, res, next) => {
    if (isTestEnvironment() && !req.headers["x-test-rate-limit"]) {
      next();
      return;
    }
    const identifier = keyGenerator ? keyGenerator(req) : getClientIp(req);
    const key = `${prefix}:${identifier}`;
    const { allowed, remaining, retryAfterSeconds } = await consumeRateLimit(
      key,
      maxPoints,
      windowSeconds
    );
    res.setHeader("X-RateLimit-Limit", maxPoints.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", retryAfterSeconds.toString());
    if (!allowed) {
      res.setHeader("Retry-After", retryAfterSeconds.toString());
      res.status(429).json({
        success: false,
        error: message || `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds
      });
      return;
    }
    next();
  };
}

// src/server/routes/auth.ts
var router = (0, import_express.Router)();
var loginLimiter = rateLimiter({
  prefix: "rl:auth:login",
  maxPoints: 10,
  windowSeconds: 15 * 60,
  // 15 minutes
  message: "Too many login attempts. Please wait 15 minutes before trying again."
});
var registerLimiter = rateLimiter({
  prefix: "rl:auth:register",
  maxPoints: 5,
  windowSeconds: 60 * 60,
  // 1 hour
  message: "Too many account registrations from this network. Please try again later."
});
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Invalid registration data" });
      return;
    }
    const { name, email, password } = parsed.data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ success: false, error: "An account with this email address already exists." });
      return;
    }
    const salt = await import_bcryptjs.default.genSalt(10);
    const passwordHash = await import_bcryptjs.default.hash(password, salt);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "CITIZEN"
        // Strictly CITIZEN
      }
    });
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: null,
      department: null,
      createdAt: user.createdAt.toISOString()
    };
    const token = signToken(safeUser);
    setAuthCookie(res, token);
    await logAuditEvent(prisma, {
      actorId: user.id,
      action: "USER_REGISTER",
      details: { email: user.email, role: "CITIZEN" }
    });
    res.status(201).json({
      success: true,
      data: { user: safeUser },
      message: "Account created successfully."
    });
  } catch (err) {
    console.error("[Register Error]", err);
    res.status(500).json({ success: false, error: "Failed to create account. Please try again." });
  }
});
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Invalid login credentials" });
      return;
    }
    const { email, password } = parsed.data;
    const isProd = process.env.NODE_ENV === "production";
    const demoEnabled = process.env.ENABLE_DEMO_ACCOUNTS === "true" || !isProd && process.env.ENABLE_DEMO_ACCOUNTS !== "false";
    const KNOWN_DEMO_PASSWORDS = ["Admin123!", "Staff123!", "Citizen123!"];
    if (!demoEnabled && KNOWN_DEMO_PASSWORDS.includes(password)) {
      res.status(403).json({
        success: false,
        error: "Demonstration logins are disabled in production. Please use your official credentials."
      });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: {
          select: { id: true, name: true, code: true, description: true }
        }
      }
    });
    if (!user) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }
    const isMatch = await import_bcryptjs.default.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: "Invalid email or password." });
      return;
    }
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      department: user.department,
      createdAt: user.createdAt.toISOString()
    };
    const token = signToken(safeUser);
    setAuthCookie(res, token);
    await logAuditEvent(prisma, {
      actorId: user.id,
      action: "USER_LOGIN",
      details: { email: user.email, role: user.role }
    });
    res.json({
      success: true,
      data: { user: safeUser },
      message: "Logged in successfully."
    });
  } catch (err) {
    console.error("[Login Error]", err);
    res.status(500).json({ success: false, error: "Login failed. Please try again later." });
  }
});
router.post("/logout", authenticateToken, async (req, res) => {
  if (req.user) {
    await logAuditEvent(prisma, {
      actorId: req.user.id,
      action: "USER_LOGOUT",
      details: { email: req.user.email }
    });
  }
  clearAuthCookie(res);
  res.json({ success: true, message: "Logged out successfully." });
});
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});
var auth_default = router;

// src/server/routes/meta.ts
var import_express2 = require("express");
var router2 = (0, import_express2.Router)();
router2.get("/departments", async (_req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, description: true }
    });
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch departments." });
  }
});
router2.get("/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, description: true, keywords: true }
    });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch categories." });
  }
});
router2.get("/service-areas", async (_req, res) => {
  try {
    const areas = await prisma.serviceArea.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, description: true }
    });
    res.json({ success: true, data: areas });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch service areas." });
  }
});
router2.get("/routing-rules", async (_req, res) => {
  try {
    const rules = await prisma.routingRule.findMany({
      include: {
        category: { select: { id: true, name: true, code: true } },
        serviceArea: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } }
      },
      orderBy: [{ category: { name: "asc" } }, { serviceArea: { name: "asc" } }]
    });
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch routing rules." });
  }
});
router2.get("/config", async (_req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const enableDemoAccounts = process.env.ENABLE_DEMO_ACCOUNTS === "true" || !isProd && process.env.ENABLE_DEMO_ACCOUNTS !== "false";
  res.json({
    success: true,
    data: {
      enableDemoAccounts,
      storageProvider: process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local",
      directUploadEnabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      aiProvider: process.env.AI_PROVIDER || "fallback",
      environment: process.env.NODE_ENV || "development"
    }
  });
});
var meta_default = router2;

// src/server/routes/complaints.ts
var import_express3 = require("express");
var import_fs3 = __toESM(require("fs"));

// src/server/middleware/upload.ts
var import_multer = __toESM(require("multer"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var import_crypto2 = __toESM(require("crypto"));

// src/shared/constants.ts
var CATEGORIES = [
  {
    code: "ROADS",
    name: "Roads and potholes",
    description: "Damaged asphalt, craters, potholes, missing road markings, damaged curbs, or hazardous street surfaces.",
    defaultKeywords: ["pothole", "crater", "asphalt", "road damage", "curb", "pavement", "street surface", "traffic hazard"]
  },
  {
    code: "STREETLIGHTS",
    name: "Streetlights",
    description: "Broken lamp posts, dark streets, flickering bulbs, damaged wiring, or public lighting outages.",
    defaultKeywords: ["streetlight", "lamp", "light post", "flicker", "dark street", "blackout street", "light bulb"]
  },
  {
    code: "WATER",
    name: "Water supply",
    description: "Burst pipelines, contaminated water, tap water outages, low water pressure, or main leaks.",
    defaultKeywords: ["water pipe", "pipe burst", "contaminated water", "tap water", "low pressure", "no water", "leak", "water supply"]
  },
  {
    code: "DRAINAGE",
    name: "Drainage and sewage",
    description: "Overflowing storm drains, sewage stench, clogged gutters, manhole blockages, or wastewater backups.",
    defaultKeywords: ["drain", "drainage", "sewage", "stench", "manhole", "overflow", "clogged gutter", "wastewater", "sewer"]
  },
  {
    code: "SANITATION",
    name: "Garbage and sanitation",
    description: "Uncollected refuse, illegal dumping, overflowing public trash bins, rotting waste, or litter accumulation.",
    defaultKeywords: ["garbage", "trash", "waste", "litter", "dumping", "rubbish", "refuse", "sanitation", "bins"]
  },
  {
    code: "OTHER",
    name: "Other / uncertain",
    description: "Uncertain, multi-domain, ambiguous civic issues, or issues requiring administrative triage.",
    defaultKeywords: ["other", "general", "unknown", "unsure"]
  }
];
var SCORING_CONFIG = {
  weights: {
    priority: 0.45,
    urgency: 0.4,
    duration: 0.15
  },
  // Strict threshold: strictly greater than 7 (score > 7)
  starThreshold: 7,
  confidenceThreshold: 0.75,
  maxScore: 10,
  minScore: 0,
  daysPerDurationPoint: 3,
  maxDurationScoreDays: 30
  // 30 / 3 = 10
};
var UPLOAD_LIMITS = {
  maxFiles: 3,
  maxSizeBytes: 5 * 1024 * 1024,
  // 5 MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"]
};
var STATUS_TRANSITIONS = {
  SUBMITTED: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS", "SUBMITTED"],
  IN_PROGRESS: ["RESOLVED", "ASSIGNED"],
  RESOLVED: ["ASSIGNED"]
  // Can be reopened by admin with explanation
};

// src/server/middleware/upload.ts
var uploadDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? "/tmp/uploads" : import_path.default.resolve(process.cwd(), "uploads"));
try {
  if (!import_fs.default.existsSync(uploadDir)) {
    import_fs.default.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn("[Upload Directory Setup Notice]", e);
}
var storage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const randomBytes = import_crypto2.default.randomBytes(16).toString("hex");
    const ext = import_path.default.extname(file.originalname).toLowerCase();
    const safeExt = UPLOAD_LIMITS.allowedExtensions.includes(ext) ? ext : ".jpg";
    cb(null, `${Date.now()}-${randomBytes}${safeExt}`);
  }
});
var complaintUpload = (0, import_multer.default)({
  storage,
  limits: {
    fileSize: UPLOAD_LIMITS.maxSizeBytes,
    files: UPLOAD_LIMITS.maxFiles
  },
  fileFilter: (_req, file, cb) => {
    const ext = import_path.default.extname(file.originalname).toLowerCase();
    if (UPLOAD_LIMITS.allowedMimeTypes.includes(file.mimetype) && UPLOAD_LIMITS.allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, WEBP.`));
    }
  }
});

// src/server/services/scoring.ts
function calculateAgeInDays(createdAt, resolvedAt, now = /* @__PURE__ */ new Date()) {
  const targetDate = resolvedAt ? new Date(resolvedAt) : now;
  const createdDate = new Date(createdAt);
  const diffMs = Math.max(0, targetDate.getTime() - createdDate.getTime());
  return Math.floor(diffMs / (24 * 60 * 60 * 1e3));
}
function calculateDurationScore(unresolvedAgeInDays) {
  return Math.min(10, Math.max(0, Math.floor(unresolvedAgeInDays / SCORING_CONFIG.daysPerDurationPoint)));
}
function evaluateStars(effectivePriority, durationScore, effectiveUrgency, effectiveFeasibility) {
  return {
    redPriority: effectivePriority > SCORING_CONFIG.starThreshold,
    pinkDuration: durationScore > SCORING_CONFIG.starThreshold,
    orangeUrgency: effectiveUrgency > SCORING_CONFIG.starThreshold,
    greenFeasibility: effectiveFeasibility > SCORING_CONFIG.starThreshold
  };
}
function calculateCoreScore(effectivePriority, effectiveUrgency, durationScore) {
  const raw = SCORING_CONFIG.weights.priority * effectivePriority + SCORING_CONFIG.weights.urgency * effectiveUrgency + SCORING_CONFIG.weights.duration * durationScore;
  return Math.round(raw * 10) / 10;
}
function computeComplaintScores(data, now = /* @__PURE__ */ new Date()) {
  const unresolvedAgeDays = calculateAgeInDays(data.createdAt, data.resolvedAt, now);
  const durationScore = calculateDurationScore(unresolvedAgeDays);
  const effectivePriority = data.overridePriority !== null && data.overridePriority !== void 0 ? data.overridePriority : data.priority;
  const effectiveUrgency = data.overrideUrgency !== null && data.overrideUrgency !== void 0 ? data.overrideUrgency : data.urgency;
  const effectiveFeasibility = data.overrideFeasibility !== null && data.overrideFeasibility !== void 0 ? data.overrideFeasibility : data.feasibility;
  const hasOverrides = data.overridePriority !== null && data.overridePriority !== void 0 || data.overrideUrgency !== null && data.overrideUrgency !== void 0 || data.overrideFeasibility !== null && data.overrideFeasibility !== void 0;
  const coreScore = calculateCoreScore(effectivePriority, effectiveUrgency, durationScore);
  const stars = evaluateStars(effectivePriority, durationScore, effectiveUrgency, effectiveFeasibility);
  return {
    priority: data.priority,
    durationScore,
    urgency: data.urgency,
    feasibility: data.feasibility,
    coreScore,
    unresolvedAgeDays,
    stars,
    hasOverrides,
    effectivePriority,
    effectiveUrgency,
    effectiveFeasibility
  };
}

// src/server/services/ai/classifier.ts
var import_zod2 = require("zod");
var AIResponseSchema = import_zod2.z.object({
  categoryCode: import_zod2.z.enum(["ROADS", "STREETLIGHTS", "WATER", "DRAINAGE", "SANITATION", "OTHER"]),
  confidence: import_zod2.z.number().min(0).max(1),
  priority: import_zod2.z.number().min(0).max(10),
  urgency: import_zod2.z.number().min(0).max(10),
  feasibility: import_zod2.z.number().min(0).max(10),
  rationale: import_zod2.z.string().min(5).max(500)
});
function classifyWithRules(title, description) {
  const combinedText = `${title} ${description}`.toLowerCase();
  const scores = {
    ROADS: 0,
    STREETLIGHTS: 0,
    WATER: 0,
    DRAINAGE: 0,
    SANITATION: 0
  };
  const roadKeywords = ["pothole", "crater", "asphalt", "road damage", "pavement", "curb", "street surface", "traffic hazard", "manhole cover broken", "bumps", "speed bump", "road"];
  const lightKeywords = ["streetlight", "street light", "street lamp", "lamp post", "lamp", "light pole", "dark street", "blackout", "flicker", "bulb", "lighting", "lantern", "pole light"];
  const waterKeywords = ["pipe burst", "water leak", "tap water", "contaminated water", "low pressure", "no water", "water supply", "water meter", "drinking water", "water main", "hydrant", "water"];
  const drainKeywords = ["drain", "drainage", "sewage", "stench", "manhole overflow", "clogged gutter", "storm drain", "sewer", "gutter", "wastewater", "cesspool"];
  const sanitationKeywords = ["garbage", "trash", "waste", "litter", "dumping", "rubbish", "refuse", "sanitation", "bins", "dumpster", "smell of garbage", "debris"];
  for (const kw of roadKeywords) {
    if (combinedText.includes(kw)) scores.ROADS += kw.length > 5 ? 2 : 1;
  }
  for (const kw of lightKeywords) {
    if (combinedText.includes(kw)) scores.STREETLIGHTS += kw.length > 5 ? 2 : 1;
  }
  for (const kw of waterKeywords) {
    if (combinedText.includes(kw)) scores.WATER += kw.length > 5 ? 2 : 1;
  }
  for (const kw of drainKeywords) {
    if (combinedText.includes(kw)) scores.DRAINAGE += kw.length > 5 ? 2 : 1;
  }
  for (const kw of sanitationKeywords) {
    if (combinedText.includes(kw)) scores.SANITATION += kw.length > 5 ? 2 : 1;
  }
  let bestCategory = "OTHER";
  let maxScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }
  let confidence = 0.5;
  if (maxScore >= 4) {
    confidence = 0.92;
  } else if (maxScore >= 2) {
    confidence = 0.82;
  } else if (maxScore === 1) {
    confidence = 0.68;
  } else {
    bestCategory = "OTHER";
    confidence = 0.35;
  }
  let priority = 5;
  if (combinedText.includes("severe") || combinedText.includes("huge") || combinedText.includes("flooding") || combinedText.includes("contamination") || combinedText.includes("hazard") || combinedText.includes("danger") || combinedText.includes("accident")) {
    priority = 8.5;
  } else if (combinedText.includes("minor") || combinedText.includes("small") || combinedText.includes("slight") || combinedText.includes("cosmetic")) {
    priority = 3.5;
  } else if (bestCategory === "WATER" || bestCategory === "DRAINAGE") {
    priority = 7.5;
  } else if (bestCategory === "ROADS") {
    priority = 6.5;
  } else {
    priority = 5.5;
  }
  let urgency = 5;
  if (combinedText.includes("emergency") || combinedText.includes("immediate") || combinedText.includes("accident risk") || combinedText.includes("overflowing") || combinedText.includes("burst") || combinedText.includes("risk of injury") || combinedText.includes("dark")) {
    urgency = 8.8;
  } else if (combinedText.includes("gradual") || combinedText.includes("old") || combinedText.includes("months") || combinedText.includes("not urgent")) {
    urgency = 3.2;
  } else if (bestCategory === "STREETLIGHTS" && combinedText.includes("dark")) {
    urgency = 7.8;
  } else {
    urgency = 5.8;
  }
  let feasibility = 6.5;
  if (bestCategory === "STREETLIGHTS" || combinedText.includes("bulb") || combinedText.includes("replace")) {
    feasibility = 8.5;
  } else if (combinedText.includes("patch") || combinedText.includes("sweep") || combinedText.includes("pickup")) {
    feasibility = 7.8;
  } else if (combinedText.includes("rebuild") || combinedText.includes("main pipeline") || combinedText.includes("heavy machinery") || combinedText.includes("structural")) {
    feasibility = 3.5;
  } else {
    feasibility = 6;
  }
  const catMeta = CATEGORIES.find((c) => c.code === bestCategory) || CATEGORIES.find((c) => c.code === "OTHER");
  const needsReview = confidence < SCORING_CONFIG.confidenceThreshold || bestCategory === "OTHER";
  const reviewReason = bestCategory === "OTHER" ? "Category classified as Other/uncertain; manual municipal review required." : confidence < SCORING_CONFIG.confidenceThreshold ? `Classification confidence (${Math.round(confidence * 100)}%) is below administrative threshold (${Math.round(SCORING_CONFIG.confidenceThreshold * 100)}%).` : void 0;
  return {
    categoryCode: bestCategory,
    categoryName: catMeta.name,
    confidence,
    priority: Math.round(priority * 10) / 10,
    urgency: Math.round(urgency * 10) / 10,
    feasibility: Math.round(feasibility * 10) / 10,
    rationale: `Rule-based keyword heuristic matched ${bestCategory} with score ${maxScore}. Rationale: assessed essential service impact (${priority}/10), public hazard risk (${urgency}/10), and provisional task complexity (${feasibility}/10).`,
    provider: needsReview ? "needs_review" : "rule_based_fallback",
    version: "rule-engine-v1.0",
    needsReview,
    reviewReason
  };
}
async function classifyComplaint(title, description) {
  const provider = process.env.AI_PROVIDER || "fallback";
  const apiKey = process.env.GEMINI_API_KEY;
  if (provider === "gemini" && apiKey && apiKey.trim().length > 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6e3);
      const prompt = `You are a municipal civic triage assistant. Analyze this citizen complaint:
Title: ${JSON.stringify(title)}
Description: ${JSON.stringify(description)}

Allowed categories:
- ROADS: Roads and potholes, damaged asphalt, craters, curbs, pavement
- STREETLIGHTS: Streetlights, dark streets, broken bulbs, pole wiring
- WATER: Water supply, pipe bursts, contaminated water, tap water outages
- DRAINAGE: Drainage and sewage, overflowing storm drains, sewer stench
- SANITATION: Garbage and sanitation, uncollected trash, illegal dumping
- OTHER: Ambiguous or other domain

Rubric (0.0 to 10.0 scale):
- priority: disruption and essential health impact
- urgency: immediate accident risk or rapid worsening
- feasibility: provisional ease of resolution (e.g. 8-9 for simple fix, 2-4 for major construction)

Output strictly valid JSON with this exact structure:
{
  "categoryCode": "ROADS" | "STREETLIGHTS" | "WATER" | "DRAINAGE" | "SANITATION" | "OTHER",
  "confidence": number (between 0.0 and 1.0),
  "priority": number (between 0.0 and 10.0),
  "urgency": number (between 0.0 and 10.0),
  "feasibility": number (between 0.0 and 10.0),
  "rationale": string (brief explanation under 200 chars)
}`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          const validated = AIResponseSchema.parse(parsed);
          const catMeta = CATEGORIES.find((c) => c.code === validated.categoryCode) || CATEGORIES.find((c) => c.code === "OTHER");
          const needsReview = validated.confidence < SCORING_CONFIG.confidenceThreshold || validated.categoryCode === "OTHER";
          return {
            categoryCode: validated.categoryCode,
            categoryName: catMeta.name,
            confidence: Math.round(validated.confidence * 100) / 100,
            priority: Math.round(validated.priority * 10) / 10,
            urgency: Math.round(validated.urgency * 10) / 10,
            feasibility: Math.round(validated.feasibility * 10) / 10,
            rationale: validated.rationale,
            provider: needsReview ? "needs_review" : "ai_analyzed",
            version: "gemini-1.5-flash-v1",
            needsReview,
            reviewReason: needsReview ? validated.categoryCode === "OTHER" ? "Category classified as Other/uncertain." : `AI confidence heuristic (${Math.round(validated.confidence * 100)}%) is below operational threshold.` : void 0
          };
        }
      }
    } catch (err) {
      console.warn("[AI Classifier] Gemini provider call failed or timed out, falling back safely to deterministic rules:", err);
    }
  }
  return classifyWithRules(title, description);
}

// src/server/services/routing.ts
async function routeComplaint(prisma2, categoryId, serviceAreaId) {
  if (!categoryId) {
    return {
      departmentId: null,
      departmentName: null,
      success: false,
      requiresReview: true,
      reason: "No category assigned; cannot determine department."
    };
  }
  const category = await prisma2.category.findUnique({
    where: { id: categoryId }
  });
  if (!category || category.code === "OTHER") {
    return {
      departmentId: null,
      departmentName: null,
      success: false,
      requiresReview: true,
      reason: "Category is Other / uncertain; requires administrative review."
    };
  }
  const rule = await prisma2.routingRule.findUnique({
    where: {
      categoryId_serviceAreaId: {
        categoryId,
        serviceAreaId
      }
    },
    include: {
      department: true
    }
  });
  if (!rule || !rule.department) {
    return {
      departmentId: null,
      departmentName: null,
      success: false,
      requiresReview: true,
      reason: `No routing rule exists for category "${category.name}" in selected service area. Sent to administrator review.`
    };
  }
  return {
    departmentId: rule.department.id,
    departmentName: rule.department.name,
    success: true,
    requiresReview: false
  };
}

// src/server/services/storage.ts
var import_path2 = __toESM(require("path"));
var import_fs2 = __toESM(require("fs"));
var import_crypto3 = __toESM(require("crypto"));
var import_stream = require("stream");
var import_blob = require("@vercel/blob");
var import_client = require("@vercel/blob/client");
var localUploadDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? "/tmp/uploads" : import_path2.default.resolve(process.cwd(), "uploads"));
try {
  if (!import_fs2.default.existsSync(localUploadDir)) {
    import_fs2.default.mkdirSync(localUploadDir, { recursive: true });
  }
} catch (e) {
  console.warn("[Storage] Notice on local upload directory creation:", e);
}
var isBlobStorageConfigured = () => {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
};
function assertStorageConfigured() {
  if (process.env.NODE_ENV === "production" && !isBlobStorageConfigured()) {
    throw new Error(
      "CRITICAL STORAGE ERROR: BLOB_READ_WRITE_TOKEN is missing in production. Durable private object storage (Vercel Blob) is strictly required. Local or temporary filesystem storage is forbidden in production."
    );
  }
}
async function saveAttachment(buffer, originalFilename, mimeType, userId) {
  assertStorageConfigured();
  const ext = import_path2.default.extname(originalFilename).toLowerCase();
  const safeExt = UPLOAD_LIMITS.allowedExtensions.includes(ext) ? ext : ".jpg";
  const randomBytes = import_crypto3.default.randomBytes(8).toString("hex");
  const safeBlobPath = `attachments/users/${userId}/${Date.now()}-${randomBytes}${safeExt}`;
  if (isBlobStorageConfigured()) {
    const blob = await (0, import_blob.put)(safeBlobPath, buffer, {
      access: "private",
      // Strictly private: no anonymous CDN downloads
      contentType: mimeType,
      addRandomSuffix: false
    });
    return {
      originalFilename,
      storageFilename: blob.url,
      mimeType,
      fileSize: buffer.length,
      url: blob.url
    };
  }
  const safeFilename = `${Date.now()}-${randomBytes}${safeExt}`;
  const filePath = import_path2.default.join(localUploadDir, safeFilename);
  await import_fs2.default.promises.writeFile(filePath, buffer);
  return {
    originalFilename,
    storageFilename: safeFilename,
    mimeType,
    fileSize: buffer.length
  };
}
async function resolveAttachment(storageFilename) {
  if (storageFilename.startsWith("http://") || storageFilename.startsWith("https://")) {
    if (!isBlobStorageConfigured()) {
      console.error("[Storage] Cannot resolve blob URL without BLOB_READ_WRITE_TOKEN.");
      return { type: "missing" };
    }
    try {
      const response = await (0, import_blob.get)(storageFilename, { access: "private" });
      if (!response || !response.stream) {
        return { type: "missing" };
      }
      const nodeStream = import_stream.Readable.fromWeb(response.stream);
      return {
        type: "stream",
        stream: nodeStream,
        mimeType: response.blob?.contentType || void 0
      };
    } catch (err) {
      console.error("[Storage] Error reading private blob from Vercel:", err?.message || err);
      return { type: "missing" };
    }
  }
  const filePath = import_path2.default.join(localUploadDir, storageFilename);
  if (!import_fs2.default.existsSync(filePath)) {
    return { type: "missing" };
  }
  return {
    type: "stream",
    stream: import_fs2.default.createReadStream(filePath)
  };
}
async function handleDirectBlobUpload(req, res, prismaClient) {
  if (!isBlobStorageConfigured()) {
    res.status(501).json({
      success: false,
      error: "Direct blob upload is not configured. BLOB_READ_WRITE_TOKEN is missing."
    });
    return;
  }
  if (!req.user || !req.user.id) {
    res.status(401).json({
      success: false,
      error: "Authentication required to obtain an upload authorization token."
    });
    return;
  }
  try {
    const body = req.body;
    const jsonResponse = await (0, import_client.handleUpload)({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const ext = import_path2.default.extname(pathname).toLowerCase();
        if (!UPLOAD_LIMITS.allowedExtensions.includes(ext)) {
          throw new Error(`File extension "${ext}" is not permitted. Only JPG, PNG, and WEBP are allowed.`);
        }
        const randomBytes = import_crypto3.default.randomBytes(8).toString("hex");
        const userScopedPath = `attachments/users/${req.user.id}/${Date.now()}-${randomBytes}${ext}`;
        if (prismaClient?.uploadGrant) {
          try {
            await prismaClient.uploadGrant.create({
              data: {
                userId: req.user.id,
                pathname: userScopedPath,
                expiresAt: new Date(Date.now() + 60 * 60 * 1e3)
                // 1 hour
              }
            });
          } catch (grantErr) {
            console.warn("[Storage] Notice on upload grant recording:", grantErr);
          }
        }
        return {
          allowedContentTypes: [...UPLOAD_LIMITS.allowedMimeTypes],
          maximumSizeInBytes: UPLOAD_LIMITS.maxSizeBytes,
          // 5 MB
          tokenPayload: JSON.stringify({ userId: req.user.id, pathname: userScopedPath }),
          pathname: userScopedPath,
          access: "private"
          // Enforce private store access
        };
      },
      onUploadCompleted: async ({ blob }) => {
        if (prismaClient?.uploadGrant && blob?.url) {
          try {
            await prismaClient.uploadGrant.updateMany({
              where: {
                userId: req.user.id,
                pathname: blob.pathname
              },
              data: {
                storageUrl: blob.url
              }
            });
          } catch {
          }
        }
      }
    });
    res.json(jsonResponse);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message || "Direct upload token creation failed." });
  }
}
async function validatePreUploadedAttachment(attachment, submittingUserId, prismaClient) {
  if (!attachment || typeof attachment !== "object") {
    return { valid: false, error: "Attachment data is invalid." };
  }
  const { storageFilename, originalFilename, mimeType, fileSize } = attachment;
  if (!storageFilename || typeof storageFilename !== "string") {
    return { valid: false, error: "Attachment storage identifier is missing." };
  }
  if (fileSize && (fileSize > UPLOAD_LIMITS.maxSizeBytes || fileSize <= 0)) {
    return { valid: false, error: "Attachment exceeds the 5MB size limit." };
  }
  if (mimeType && !UPLOAD_LIMITS.allowedMimeTypes.includes(mimeType)) {
    return { valid: false, error: `Disallowed MIME type "${mimeType}". Allowed: JPG, PNG, WEBP.` };
  }
  const ext = import_path2.default.extname(originalFilename || storageFilename).toLowerCase();
  if (originalFilename && !UPLOAD_LIMITS.allowedExtensions.includes(ext)) {
    return { valid: false, error: `Invalid file extension "${ext}".` };
  }
  if (storageFilename.startsWith("http://") || storageFilename.startsWith("https://")) {
    let parsedUrl;
    try {
      parsedUrl = new URL(storageFilename);
    } catch {
      return { valid: false, error: "Attachment storage URL is malformed." };
    }
    if (parsedUrl.protocol !== "https:") {
      return { valid: false, error: "Insecure attachment protocol. HTTPS required." };
    }
    if (!parsedUrl.hostname.endsWith(".blob.vercel-storage.com")) {
      return { valid: false, error: "Untrusted storage host. Only our Vercel Blob store is permitted." };
    }
    const expectedUserPrefix = `/attachments/users/${submittingUserId}/`;
    if (!parsedUrl.pathname.includes(expectedUserPrefix)) {
      return {
        valid: false,
        error: "Upload ownership mismatch: this file was not authorized for your user account."
      };
    }
    if (prismaClient?.uploadGrant) {
      const grant = await prismaClient.uploadGrant.findFirst({
        where: {
          userId: submittingUserId,
          used: false,
          expiresAt: { gte: /* @__PURE__ */ new Date() },
          OR: [
            { pathname: { in: [parsedUrl.pathname.slice(1), parsedUrl.pathname] } },
            { storageUrl: storageFilename }
          ]
        }
      });
      if (!grant && process.env.NODE_ENV === "production") {
        return {
          valid: false,
          error: "Upload authorization record not found, expired, or already used."
        };
      }
    }
    if (isBlobStorageConfigured()) {
      try {
        const meta = await (0, import_blob.head)(storageFilename);
        if (!meta) {
          return { valid: false, error: "Uploaded object not found in private storage." };
        }
        if (meta.size > UPLOAD_LIMITS.maxSizeBytes) {
          return { valid: false, error: `Verified attachment size (${meta.size} bytes) exceeds the 5MB limit.` };
        }
        if (meta.contentType && !UPLOAD_LIMITS.allowedMimeTypes.includes(meta.contentType)) {
          return { valid: false, error: `Verified content type "${meta.contentType}" is not an allowed image format.` };
        }
        attachment.fileSize = meta.size;
        attachment.mimeType = meta.contentType;
      } catch (headErr) {
        if (process.env.NODE_ENV === "production") {
          return { valid: false, error: "Failed to verify storage object metadata." };
        }
      }
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      return { valid: false, error: "Local storage references are forbidden in production." };
    }
    if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(storageFilename)) {
      return { valid: false, error: "Invalid local attachment filename." };
    }
    const localFilePath = import_path2.default.join(localUploadDir, storageFilename);
    if (import_fs2.default.existsSync(localFilePath)) {
      const stat = import_fs2.default.statSync(localFilePath);
      if (stat.size > UPLOAD_LIMITS.maxSizeBytes) {
        return { valid: false, error: "Attachment exceeds the 5MB size limit." };
      }
      attachment.fileSize = stat.size;
    }
  }
  const existing = await prismaClient.attachment.findFirst({
    where: { storageFilename }
  });
  if (existing) {
    return { valid: false, error: "This photo has already been registered to another complaint." };
  }
  return { valid: true };
}
async function markUploadGrantsUsed(storageFilenames, userId, prismaClient) {
  if (!prismaClient?.uploadGrant || !storageFilenames.length) return;
  try {
    for (const filename of storageFilenames) {
      let pathnameMatch = filename;
      try {
        const u = new URL(filename);
        pathnameMatch = u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
      } catch {
      }
      await prismaClient.uploadGrant.updateMany({
        where: {
          userId,
          OR: [
            { storageUrl: filename },
            { pathname: pathnameMatch }
          ]
        },
        data: {
          used: true,
          storageUrl: filename
        }
      });
    }
  } catch (err) {
    console.warn("[Storage] Error marking upload grants as used:", err);
  }
}

// src/server/routes/complaints.ts
var router3 = (0, import_express3.Router)();
var uploadAuthLimiter = rateLimiter({
  prefix: "rl:upload:auth",
  maxPoints: 15,
  windowSeconds: 15 * 60,
  // 15 requests per 15 mins
  message: "Upload authorization limit reached. Please wait a few minutes before uploading more photos."
});
var complaintSubmitLimiter = rateLimiter({
  prefix: "rl:complaint:submit",
  maxPoints: 10,
  windowSeconds: 15 * 60,
  // 10 complaints per 15 mins
  message: "Complaint submission limit reached. Please wait a few minutes before submitting another report.",
  keyGenerator: (req) => req.user?.id || req.ip || "unknown"
});
function formatComplaint(c, currentUserRole) {
  const scores = computeComplaintScores({
    createdAt: c.createdAt,
    resolvedAt: c.resolvedAt,
    priority: c.priority,
    urgency: c.urgency,
    feasibility: c.feasibility,
    overridePriority: c.overridePriority,
    overrideUrgency: c.overrideUrgency,
    overrideFeasibility: c.overrideFeasibility
  });
  const statusHistory = c.statusHistory ? c.statusHistory.filter((sh) => currentUserRole === "CITIZEN" ? sh.isCitizenVisible : true).map((sh) => ({
    id: sh.id,
    fromStatus: sh.fromStatus,
    toStatus: sh.toStatus,
    note: sh.note,
    isCitizenVisible: sh.isCitizenVisible,
    changedById: sh.changedById,
    changedByName: sh.changedBy?.name || "Staff Member",
    createdAt: sh.createdAt.toISOString()
  })) : void 0;
  const attachments = c.attachments ? c.attachments.map((att) => ({
    id: att.id,
    originalFilename: att.originalFilename,
    mimeType: att.mimeType,
    fileSize: att.fileSize,
    createdAt: att.createdAt.toISOString(),
    url: `/api/complaints/${c.id}/attachments/${att.id}`
  })) : void 0;
  const auditEvents = c.auditEvents && currentUserRole !== "CITIZEN" ? c.auditEvents.map((ae) => ({
    id: ae.id,
    complaintId: ae.complaintId,
    actorId: ae.actorId,
    actorName: ae.actor?.name || "System / Staff",
    action: ae.action,
    details: (() => {
      try {
        return JSON.parse(ae.details);
      } catch {
        return { raw: ae.details };
      }
    })(),
    createdAt: ae.createdAt.toISOString()
  })) : void 0;
  return {
    id: c.id,
    reference: c.reference,
    title: c.title,
    description: c.description,
    address: c.address,
    serviceAreaId: c.serviceAreaId,
    serviceArea: c.serviceArea,
    categoryId: c.categoryId,
    category: c.category,
    departmentId: c.departmentId,
    department: c.department,
    citizenId: c.citizenId,
    citizenName: c.citizen?.name,
    firstNoticedDate: c.firstNoticedDate ? c.firstNoticedDate.toISOString() : null,
    status: c.status,
    analysisState: c.analysisState,
    reviewState: c.reviewState,
    analysisProvider: c.analysisProvider,
    analysisVersion: c.analysisVersion,
    classificationConfidence: c.classificationConfidence,
    aiRationale: c.aiRationale,
    scores,
    rawPriority: c.priority,
    rawUrgency: c.urgency,
    rawFeasibility: c.feasibility,
    overridePriority: c.overridePriority,
    overrideUrgency: c.overrideUrgency,
    overrideFeasibility: c.overrideFeasibility,
    overrideReason: c.overrideReason,
    overriddenById: c.overriddenById,
    overriddenByName: c.overriddenBy?.name,
    overriddenAt: c.overriddenAt ? c.overriddenAt.toISOString() : null,
    resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
    resolutionNote: c.resolutionNote,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    attachments,
    statusHistory,
    auditEvents
  };
}
async function generateComplaintReference() {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const count = await prisma.complaint.count();
  const num = (count + 1).toString().padStart(4, "0");
  const candidate = `CR-${year}-${num}`;
  const exists = await prisma.complaint.findUnique({ where: { reference: candidate } });
  if (exists) {
    const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
    return `CR-${year}-${randomSuffix}`;
  }
  return candidate;
}
router3.post("/upload-handler", authenticateToken, uploadAuthLimiter, (req, res) => {
  return handleDirectBlobUpload(req, res, prisma);
});
router3.post(
  "/",
  authenticateToken,
  complaintSubmitLimiter,
  complaintUpload.array("attachments", 3),
  async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Authentication required" });
        return;
      }
      const parsed = ComplaintCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Validation error" });
        return;
      }
      const { title, description, address, serviceAreaId, firstNoticedDate } = parsed.data;
      const serviceArea = await prisma.serviceArea.findUnique({ where: { id: serviceAreaId } });
      if (!serviceArea) {
        res.status(400).json({ success: false, error: "Selected service area does not exist" });
        return;
      }
      const reference = await generateComplaintReference();
      const files = req.files || [];
      let finalAttachments = [];
      if (req.body.preUploadedAttachments) {
        try {
          const preUploaded = typeof req.body.preUploadedAttachments === "string" ? JSON.parse(req.body.preUploadedAttachments) : req.body.preUploadedAttachments;
          if (Array.isArray(preUploaded)) {
            for (const item of preUploaded.slice(0, 3)) {
              const validation = await validatePreUploadedAttachment(item, req.user.id, prisma);
              if (!validation.valid) {
                res.status(400).json({
                  success: false,
                  error: `Attachment authorization failed: ${validation.error}`
                });
                return;
              }
              finalAttachments.push({
                originalFilename: String(item.originalFilename || "photo.jpg"),
                storageFilename: String(item.storageFilename),
                mimeType: String(item.mimeType || "image/jpeg"),
                fileSize: Number(item.fileSize || 0)
              });
            }
          }
        } catch (e) {
          res.status(400).json({ success: false, error: "Invalid attachments format: " + e.message });
          return;
        }
      }
      if (files.length > 0) {
        for (const file of files) {
          if (isBlobStorageConfigured()) {
            const buffer = await import_fs3.default.promises.readFile(file.path);
            const saved = await saveAttachment(buffer, file.originalname, file.mimetype, req.user.id);
            finalAttachments.push({
              originalFilename: saved.originalFilename,
              storageFilename: saved.storageFilename,
              mimeType: saved.mimeType,
              fileSize: saved.fileSize
            });
            import_fs3.default.promises.unlink(file.path).catch(() => {
            });
          } else {
            if (process.env.NODE_ENV === "production") {
              res.status(500).json({
                success: false,
                error: "Production storage misconfiguration: BLOB_READ_WRITE_TOKEN is required for uploads."
              });
              return;
            }
            finalAttachments.push({
              originalFilename: file.originalname,
              storageFilename: file.filename,
              mimeType: file.mimetype,
              fileSize: file.size
            });
          }
        }
      }
      const complaint = await prisma.complaint.create({
        data: {
          reference,
          title,
          description,
          address,
          serviceAreaId,
          citizenId: req.user.id,
          firstNoticedDate: firstNoticedDate ? new Date(firstNoticedDate) : null,
          status: "SUBMITTED",
          analysisState: "PENDING",
          reviewState: "NOT_REQUIRED",
          attachments: {
            create: finalAttachments
          }
        }
      });
      await logAuditEvent(prisma, {
        complaintId: complaint.id,
        actorId: req.user.id,
        action: "SUBMIT_COMPLAINT",
        details: { reference, title, serviceArea: serviceArea.name, filesCount: files.length }
      });
      if (finalAttachments.length > 0) {
        await markUploadGrantsUsed(
          finalAttachments.map((a) => a.storageFilename),
          req.user.id,
          prisma
        );
      }
      let analysisResult;
      try {
        await prisma.complaint.update({
          where: { id: complaint.id },
          data: { analysisState: "PROCESSING" }
        });
        analysisResult = await classifyComplaint(title, description);
        const category = await prisma.category.findUnique({
          where: { code: analysisResult.categoryCode }
        });
        const categoryId = category ? category.id : null;
        const routingResult = await routeComplaint(prisma, categoryId, serviceAreaId);
        const shouldReview = analysisResult.needsReview || routingResult.requiresReview;
        const newStatus = routingResult.success && !shouldReview ? "ASSIGNED" : "SUBMITTED";
        const updated = await prisma.complaint.update({
          where: { id: complaint.id },
          data: {
            categoryId,
            departmentId: routingResult.departmentId,
            status: newStatus,
            analysisState: "COMPLETED",
            reviewState: shouldReview ? "REQUIRED" : "NOT_REQUIRED",
            analysisProvider: analysisResult.provider,
            analysisVersion: analysisResult.version,
            classificationConfidence: analysisResult.confidence,
            aiRationale: analysisResult.rationale,
            priority: analysisResult.priority,
            urgency: analysisResult.urgency,
            feasibility: analysisResult.feasibility
          },
          include: {
            serviceArea: true,
            category: true,
            department: true,
            attachments: true,
            citizen: { select: { id: true, name: true, email: true } }
          }
        });
        await prisma.statusHistory.create({
          data: {
            complaintId: complaint.id,
            fromStatus: null,
            toStatus: newStatus,
            note: shouldReview ? "Complaint registered and queued for administrative review." : `Complaint classified as ${analysisResult.categoryName} and assigned to ${routingResult.departmentName}.`,
            isCitizenVisible: true,
            changedById: req.user.id
          }
        });
        await logAuditEvent(prisma, {
          complaintId: complaint.id,
          actorId: req.user.id,
          action: "CLASSIFY_AND_ROUTE",
          details: {
            category: analysisResult.categoryName,
            department: routingResult.departmentName,
            status: newStatus,
            needsReview: shouldReview,
            confidence: analysisResult.confidence,
            provider: analysisResult.provider
          }
        });
        res.status(201).json({
          success: true,
          data: formatComplaint(updated, req.user.role),
          message: "Complaint submitted and categorized successfully."
        });
        return;
      } catch (err) {
        console.error("[Analysis Error during submission]", err);
        const fallback = await prisma.complaint.update({
          where: { id: complaint.id },
          data: {
            analysisState: "FAILED",
            reviewState: "REQUIRED"
          },
          include: {
            serviceArea: true,
            category: true,
            department: true,
            attachments: true,
            citizen: { select: { id: true, name: true, email: true } }
          }
        });
        res.status(201).json({
          success: true,
          data: formatComplaint(fallback, req.user.role),
          message: "Complaint submitted. Automated analysis failed; queued for manual review."
        });
      }
    } catch (err) {
      console.error("[Complaint Submission Error]", err);
      res.status(500).json({ success: false, error: "Failed to process complaint submission." });
    }
  }
);
router3.get("/", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const filterResult = ComplaintFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      res.status(400).json({ success: false, error: filterResult.error.errors[0]?.message || "Invalid filter parameters" });
      return;
    }
    const filters = filterResult.data;
    const where = {};
    if (req.user.role === "CITIZEN") {
      where.citizenId = req.user.id;
    } else if (req.user.role === "STAFF") {
      if (!req.user.departmentId) {
        res.status(403).json({ success: false, error: "Staff account has not been assigned to a department yet." });
        return;
      }
      where.departmentId = req.user.departmentId;
    }
    if (req.user.role === "ADMIN" && filters.departmentId) {
      if (filters.departmentId === "UNASSIGNED") {
        where.departmentId = null;
      } else {
        where.departmentId = filters.departmentId;
      }
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.serviceAreaId) {
      where.serviceAreaId = filters.serviceAreaId;
    }
    if (filters.status) {
      if (filters.status === "ACTIVE") {
        where.status = { in: ["SUBMITTED", "ASSIGNED", "IN_PROGRESS"] };
      } else if (filters.status !== "ALL") {
        where.status = filters.status;
      }
    }
    if (filters.reviewState && filters.reviewState !== "ALL") {
      where.reviewState = filters.reviewState;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }
    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.trim();
      where.OR = [
        { reference: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } }
      ];
    }
    const rawComplaints = await prisma.complaint.findMany({
      where,
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } }
      }
    });
    const formattedList = rawComplaints.map((c) => formatComplaint(c, req.user?.role));
    let filteredList = formattedList.filter((item) => {
      if (filters.minCoreScore !== void 0 && item.scores.coreScore < filters.minCoreScore) {
        return false;
      }
      if (filters.starRed === "true" && !item.scores.stars.redPriority) return false;
      if (filters.starPink === "true" && !item.scores.stars.pinkDuration) return false;
      if (filters.starOrange === "true" && !item.scores.stars.orangeUrgency) return false;
      if (filters.starGreen === "true" && !item.scores.stars.greenFeasibility) return false;
      return true;
    });
    filteredList.sort((a, b) => {
      if (filters.sortBy === "coreScore") {
        const diff = b.scores.coreScore - a.scores.coreScore;
        if (Math.abs(diff) > 1e-3) return filters.sortOrder === "asc" ? -diff : diff;
        const urgDiff = b.scores.effectiveUrgency - a.scores.effectiveUrgency;
        if (Math.abs(urgDiff) > 1e-3) return urgDiff;
        const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.id.localeCompare(b.id);
      } else if (filters.sortBy === "urgency") {
        const diff = b.scores.effectiveUrgency - a.scores.effectiveUrgency;
        return filters.sortOrder === "asc" ? -diff : diff;
      } else if (filters.sortBy === "priority") {
        const diff = b.scores.effectivePriority - a.scores.effectivePriority;
        return filters.sortOrder === "asc" ? -diff : diff;
      } else if (filters.sortBy === "duration") {
        const diff = b.scores.durationScore - a.scores.durationScore;
        return filters.sortOrder === "asc" ? -diff : diff;
      } else if (filters.sortBy === "feasibility") {
        const diff = b.scores.effectiveFeasibility - a.scores.effectiveFeasibility;
        return filters.sortOrder === "asc" ? -diff : diff;
      } else if (filters.sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (filters.sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });
    const total = filteredList.length;
    const page = filters.page;
    const limit = filters.limit;
    const startIndex = (page - 1) * limit;
    const paginated = filteredList.slice(startIndex, startIndex + limit);
    res.json({
      success: true,
      data: {
        items: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1
        }
      }
    });
  } catch (err) {
    console.error("[List Complaints Error]", err);
    res.status(500).json({ success: false, error: "Failed to retrieve complaints." });
  }
});
router3.get("/:id", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const { id } = req.params;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } },
        statusHistory: {
          include: { changedBy: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "desc" }
        },
        auditEvents: {
          include: { actor: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!complaint) {
      res.status(404).json({ success: false, error: "Complaint not found." });
      return;
    }
    if (req.user.role === "CITIZEN" && complaint.citizenId !== req.user.id) {
      res.status(403).json({ success: false, error: "Access denied: You can only view your own submitted complaints." });
      return;
    }
    if (req.user.role === "STAFF" && complaint.departmentId !== req.user.departmentId) {
      res.status(403).json({ success: false, error: "Access denied: You can only view complaints assigned to your department." });
      return;
    }
    res.json({
      success: true,
      data: formatComplaint(complaint, req.user.role)
    });
  } catch (err) {
    console.error("[Get Complaint Detail Error]", err);
    res.status(500).json({ success: false, error: "Failed to fetch complaint details." });
  }
});
router3.get("/:id/attachments/:attachmentId", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const { id, attachmentId } = req.params;
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ success: false, error: "Complaint not found." });
      return;
    }
    if (req.user.role === "CITIZEN" && complaint.citizenId !== req.user.id) {
      res.status(403).json({ success: false, error: "Access denied." });
      return;
    }
    if (req.user.role === "STAFF" && complaint.departmentId !== req.user.departmentId) {
      res.status(403).json({ success: false, error: "Access denied." });
      return;
    }
    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, complaintId: id }
    });
    if (!attachment) {
      res.status(404).json({ success: false, error: "Attachment not found." });
      return;
    }
    const resolved = await resolveAttachment(attachment.storageFilename);
    if (resolved.type === "missing") {
      res.status(404).json({ success: false, error: "Attachment file not found." });
      return;
    }
    res.setHeader("Content-Type", attachment.mimeType || resolved.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(attachment.originalFilename)}"`);
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    resolved.stream.pipe(res);
  } catch (err) {
    console.error("[Attachment Serve Error]", err);
    res.status(500).json({ success: false, error: "Failed to retrieve attachment file." });
  }
});
router3.patch("/:id/status", authenticateToken, requireRole("STAFF", "ADMIN"), async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const { id } = req.params;
    const parsed = StatusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Invalid status update data" });
      return;
    }
    const { toStatus, note, isCitizenVisible, explanation } = parsed.data;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { department: true }
    });
    if (!complaint) {
      res.status(404).json({ success: false, error: "Complaint not found." });
      return;
    }
    if (req.user.role === "STAFF" && complaint.departmentId !== req.user.departmentId) {
      res.status(403).json({ success: false, error: "Access denied: You can only update complaints assigned to your department." });
      return;
    }
    const currentStatus = complaint.status;
    const allowed = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(toStatus)) {
      res.status(400).json({
        success: false,
        error: `Invalid transition from "${currentStatus}" to "${toStatus}". Allowed transitions: ${allowed.join(", ")}`
      });
      return;
    }
    if (currentStatus === "RESOLVED" && toStatus === "ASSIGNED") {
      if (req.user.role !== "ADMIN") {
        res.status(403).json({ success: false, error: "Only administrators can reopen a resolved complaint." });
        return;
      }
      if (!explanation || explanation.trim().length < 5) {
        res.status(400).json({ success: false, error: "An explanation is required to reopen a resolved complaint." });
        return;
      }
    }
    if (currentStatus === "IN_PROGRESS" && toStatus === "ASSIGNED") {
      if (!explanation || explanation.trim().length < 5) {
        res.status(400).json({ success: false, error: "An explanation is required when moving a complaint back to Assigned." });
        return;
      }
    }
    const updateData = {
      status: toStatus
    };
    if (toStatus === "RESOLVED") {
      updateData.resolvedAt = /* @__PURE__ */ new Date();
      updateData.resolutionNote = note || "Issue addressed and resolved by department staff.";
    } else if (currentStatus === "RESOLVED") {
      updateData.resolvedAt = null;
      updateData.resolutionNote = null;
    }
    const updated = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } }
      }
    });
    const statusNote = note || explanation || `Status updated from ${currentStatus} to ${toStatus}.`;
    await prisma.statusHistory.create({
      data: {
        complaintId: id,
        fromStatus: currentStatus,
        toStatus,
        note: statusNote,
        isCitizenVisible,
        changedById: req.user.id
      }
    });
    await logAuditEvent(prisma, {
      complaintId: id,
      actorId: req.user.id,
      action: "STATUS_CHANGE",
      details: {
        from: currentStatus,
        to: toStatus,
        note: statusNote,
        isCitizenVisible
      }
    });
    res.json({
      success: true,
      data: formatComplaint(updated, req.user.role),
      message: `Status successfully updated to ${toStatus}.`
    });
  } catch (err) {
    console.error("[Status Update Error]", err);
    res.status(500).json({ success: false, error: "Failed to update complaint status." });
  }
});
router3.post("/:id/flag-review", authenticateToken, requireRole("STAFF"), async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const { id } = req.params;
    const parsed = FlagForReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Reason is required" });
      return;
    }
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ success: false, error: "Complaint not found." });
      return;
    }
    if (complaint.departmentId !== req.user.departmentId) {
      res.status(403).json({ success: false, error: "Access denied: You can only flag complaints assigned to your department." });
      return;
    }
    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        reviewState: "REQUIRED"
      },
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } }
      }
    });
    await prisma.statusHistory.create({
      data: {
        complaintId: id,
        fromStatus: complaint.status,
        toStatus: complaint.status,
        note: `Flagged for administrative review: ${parsed.data.reason}`,
        isCitizenVisible: false,
        // Internal note
        changedById: req.user.id
      }
    });
    await logAuditEvent(prisma, {
      complaintId: id,
      actorId: req.user.id,
      action: "FLAG_FOR_REVIEW",
      details: { reason: parsed.data.reason }
    });
    res.json({
      success: true,
      data: formatComplaint(updated, req.user.role),
      message: "Complaint flagged for administrator review."
    });
  } catch (err) {
    console.error("[Flag For Review Error]", err);
    res.status(500).json({ success: false, error: "Failed to flag complaint for review." });
  }
});
router3.post("/:id/manual-review", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const { id } = req.params;
    const parsed = ManualReviewDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Invalid review data" });
      return;
    }
    const { categoryId, departmentId, notes } = parsed.data;
    const [category, department, complaint] = await Promise.all([
      prisma.category.findUnique({ where: { id: categoryId } }),
      prisma.department.findUnique({ where: { id: departmentId } }),
      prisma.complaint.findUnique({ where: { id } })
    ]);
    if (!complaint) {
      res.status(404).json({ success: false, error: "Complaint not found." });
      return;
    }
    if (!category) {
      res.status(400).json({ success: false, error: "Category not found." });
      return;
    }
    if (!department) {
      res.status(400).json({ success: false, error: "Department not found." });
      return;
    }
    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        categoryId,
        departmentId,
        reviewState: "APPROVED",
        status: "ASSIGNED"
        // Safe assignment moves to ASSIGNED
      },
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } }
      }
    });
    await prisma.statusHistory.create({
      data: {
        complaintId: id,
        fromStatus: complaint.status,
        toStatus: "ASSIGNED",
        note: `Administrative review completed: Category set to "${category.name}", assigned to "${department.name}". Notes: ${notes}`,
        isCitizenVisible: true,
        changedById: req.user.id
      }
    });
    await logAuditEvent(prisma, {
      complaintId: id,
      actorId: req.user.id,
      action: "MANUAL_REVIEW_DECISION",
      details: {
        categoryId,
        categoryName: category.name,
        departmentId,
        departmentName: department.name,
        notes
      }
    });
    res.json({
      success: true,
      data: formatComplaint(updated, req.user.role),
      message: "Administrative review decision applied successfully."
    });
  } catch (err) {
    console.error("[Manual Review Error]", err);
    res.status(500).json({ success: false, error: "Failed to record manual review decision." });
  }
});
router3.post("/:id/override-scores", authenticateToken, requireRole("ADMIN"), async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const { id } = req.params;
    const parsed = ScoreOverrideSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Invalid override data" });
      return;
    }
    const { priority, urgency, feasibility, reason } = parsed.data;
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ success: false, error: "Complaint not found." });
      return;
    }
    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        overridePriority: priority !== void 0 ? priority : complaint.overridePriority,
        overrideUrgency: urgency !== void 0 ? urgency : complaint.overrideUrgency,
        overrideFeasibility: feasibility !== void 0 ? feasibility : complaint.overrideFeasibility,
        overrideReason: reason,
        overriddenById: req.user.id,
        overriddenAt: /* @__PURE__ */ new Date()
      },
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } }
      }
    });
    await prisma.statusHistory.create({
      data: {
        complaintId: id,
        fromStatus: complaint.status,
        toStatus: complaint.status,
        note: `Administrative score override applied: ${reason}`,
        isCitizenVisible: false,
        changedById: req.user.id
      }
    });
    await logAuditEvent(prisma, {
      complaintId: id,
      actorId: req.user.id,
      action: "SCORE_OVERRIDE",
      details: {
        previous: {
          priority: complaint.overridePriority ?? complaint.priority,
          urgency: complaint.overrideUrgency ?? complaint.urgency,
          feasibility: complaint.overrideFeasibility ?? complaint.feasibility
        },
        overriddenTo: { priority, urgency, feasibility },
        reason
      }
    });
    res.json({
      success: true,
      data: formatComplaint(updated, req.user.role),
      message: "Scores overridden successfully."
    });
  } catch (err) {
    console.error("[Score Override Error]", err);
    res.status(500).json({ success: false, error: "Failed to override scores." });
  }
});
router3.post("/:id/retry-analysis", authenticateToken, requireRole("STAFF", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      res.status(404).json({ success: false, error: "Complaint not found." });
      return;
    }
    if (req.user?.role === "STAFF" && complaint.departmentId !== req.user.departmentId) {
      res.status(403).json({
        success: false,
        error: "Access denied: You can only retry analysis for complaints assigned to your department."
      });
      return;
    }
    const analysisResult = await classifyComplaint(complaint.title, complaint.description);
    const category = await prisma.category.findUnique({ where: { code: analysisResult.categoryCode } });
    const categoryId = category ? category.id : null;
    const routingResult = await routeComplaint(prisma, categoryId, complaint.serviceAreaId);
    const shouldReview = analysisResult.needsReview || routingResult.requiresReview;
    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        categoryId,
        departmentId: routingResult.departmentId || complaint.departmentId,
        analysisState: "COMPLETED",
        reviewState: shouldReview ? "REQUIRED" : "NOT_REQUIRED",
        analysisProvider: analysisResult.provider,
        analysisVersion: analysisResult.version,
        classificationConfidence: analysisResult.confidence,
        aiRationale: analysisResult.rationale,
        priority: analysisResult.priority,
        urgency: analysisResult.urgency,
        feasibility: analysisResult.feasibility
      },
      include: {
        serviceArea: true,
        category: true,
        department: true,
        attachments: true,
        citizen: { select: { id: true, name: true, email: true } }
      }
    });
    res.json({
      success: true,
      data: formatComplaint(updated, req.user?.role),
      message: "Analysis rerun completed successfully."
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to rerun analysis." });
  }
});
var complaints_default = router3;

// src/server/routes/admin.ts
var import_express4 = require("express");
var router4 = (0, import_express4.Router)();
router4.use(authenticateToken, requireRole("ADMIN"));
router4.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        department: {
          select: { id: true, name: true, code: true }
        },
        createdAt: true
      }
    });
    res.json({
      success: true,
      data: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString()
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve user list." });
  }
});
router4.post("/staff/assign", async (req, res) => {
  try {
    const parsed = StaffDepartmentAssignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Validation error" });
      return;
    }
    const { userId, departmentId } = parsed.data;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, error: "User not found." });
      return;
    }
    if (user.role !== "STAFF") {
      res.status(400).json({ success: false, error: "Department assignment is only applicable to STAFF accounts." });
      return;
    }
    let deptName = "Unassigned";
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!dept) {
        res.status(404).json({ success: false, error: "Department not found." });
        return;
      }
      deptName = dept.name;
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { departmentId },
      include: { department: true }
    });
    if (req.user) {
      await logAuditEvent(prisma, {
        actorId: req.user.id,
        action: "STAFF_DEPARTMENT_ASSIGN",
        details: {
          targetUserId: userId,
          targetUserName: user.name,
          departmentId,
          departmentName: deptName
        }
      });
    }
    res.json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        departmentId: updated.departmentId,
        department: updated.department,
        createdAt: updated.createdAt.toISOString()
      },
      message: `Staff member assigned to ${deptName} successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to assign staff department." });
  }
});
router4.get("/audit-logs", async (req, res) => {
  try {
    const logs = await prisma.auditEvent.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, role: true, email: true } },
        complaint: { select: { id: true, reference: true, title: true } }
      }
    });
    res.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        complaintId: log.complaintId,
        complaintReference: log.complaint?.reference,
        complaintTitle: log.complaint?.title,
        actorId: log.actorId,
        actorName: log.actor.name,
        actorRole: log.actor.role,
        action: log.action,
        details: (() => {
          try {
            return JSON.parse(log.details);
          } catch {
            return { raw: log.details };
          }
        })(),
        createdAt: log.createdAt.toISOString()
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to retrieve audit logs." });
  }
});
var admin_default = router4;

// src/server/routes/stats.ts
var import_express5 = require("express");
var router5 = (0, import_express5.Router)();
router5.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const { role, id, departmentId } = req.user;
    if (role === "CITIZEN") {
      const [total2, open, inProgress2, resolved2] = await Promise.all([
        prisma.complaint.count({ where: { citizenId: id } }),
        prisma.complaint.count({ where: { citizenId: id, status: { in: ["SUBMITTED", "ASSIGNED"] } } }),
        prisma.complaint.count({ where: { citizenId: id, status: "IN_PROGRESS" } }),
        prisma.complaint.count({ where: { citizenId: id, status: "RESOLVED" } })
      ]);
      res.json({
        success: true,
        data: {
          totalComplaints: total2,
          openComplaints: open,
          inProgressComplaints: inProgress2,
          resolvedComplaints: resolved2,
          manualReviewRequired: 0,
          highPriorityCount: 0
        }
      });
      return;
    }
    if (role === "STAFF") {
      if (!departmentId) {
        res.json({
          success: true,
          data: {
            totalComplaints: 0,
            openComplaints: 0,
            inProgressComplaints: 0,
            resolvedComplaints: 0,
            manualReviewRequired: 0,
            highPriorityCount: 0
          }
        });
        return;
      }
      const [total2, assigned2, inProgress2, resolved2] = await Promise.all([
        prisma.complaint.count({ where: { departmentId } }),
        prisma.complaint.count({ where: { departmentId, status: "ASSIGNED" } }),
        prisma.complaint.count({ where: { departmentId, status: "IN_PROGRESS" } }),
        prisma.complaint.count({ where: { departmentId, status: "RESOLVED" } })
      ]);
      res.json({
        success: true,
        data: {
          totalComplaints: total2,
          openComplaints: assigned2,
          // awaiting attention
          inProgressComplaints: inProgress2,
          resolvedComplaints: resolved2,
          manualReviewRequired: 0,
          highPriorityCount: 0
        }
      });
      return;
    }
    const [total, submitted, assigned, inProgress, resolved, reviewReq, allComplaints] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: "SUBMITTED" } }),
      prisma.complaint.count({ where: { status: "ASSIGNED" } }),
      prisma.complaint.count({ where: { status: "IN_PROGRESS" } }),
      prisma.complaint.count({ where: { status: "RESOLVED" } }),
      prisma.complaint.count({ where: { reviewState: "REQUIRED" } }),
      prisma.complaint.findMany({
        select: {
          id: true,
          createdAt: true,
          resolvedAt: true,
          priority: true,
          urgency: true,
          feasibility: true,
          overridePriority: true,
          overrideUrgency: true,
          overrideFeasibility: true,
          departmentId: true,
          status: true
        }
      })
    ]);
    let highPriorityCount = 0;
    for (const c of allComplaints) {
      const scores = computeComplaintScores({
        createdAt: c.createdAt,
        resolvedAt: c.resolvedAt,
        priority: c.priority,
        urgency: c.urgency,
        feasibility: c.feasibility,
        overridePriority: c.overridePriority,
        overrideUrgency: c.overrideUrgency,
        overrideFeasibility: c.overrideFeasibility
      });
      if (scores.coreScore > 7) {
        highPriorityCount++;
      }
    }
    const departments = await prisma.department.findMany({
      include: {
        complaints: {
          select: { id: true, status: true }
        }
      },
      orderBy: { name: "asc" }
    });
    const departmentStats = departments.map((d) => ({
      departmentId: d.id,
      departmentName: d.name,
      total: d.complaints.length,
      inProgress: d.complaints.filter((c) => c.status === "IN_PROGRESS").length,
      resolved: d.complaints.filter((c) => c.status === "RESOLVED").length
    }));
    res.json({
      success: true,
      data: {
        totalComplaints: total,
        openComplaints: submitted + assigned,
        inProgressComplaints: inProgress,
        resolvedComplaints: resolved,
        manualReviewRequired: reviewReq,
        highPriorityCount,
        departmentStats
      }
    });
  } catch (err) {
    console.error("[Dashboard Stats Error]", err);
    res.status(500).json({ success: false, error: "Failed to retrieve dashboard statistics." });
  }
});
var stats_default = router5;

// src/server/app.ts
var globalForPrisma = global;
var prisma = globalForPrisma.prisma || new import_client2.PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
});
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
function createApp() {
  const app = (0, import_express6.default)();
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    const rawId = req.headers["x-request-id"];
    const requestId = typeof rawId === "string" && rawId.length > 0 && rawId.length < 100 ? rawId : import_crypto4.default.randomUUID();
    req.id = requestId;
    res.setHeader("X-Request-Id", requestId);
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (process.env.NODE_ENV !== "test") {
        console.log(
          `[HTTP] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms reqId=${requestId}`
        );
      }
    });
    next();
  });
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.blob.vercel-storage.com; connect-src 'self' https://*.blob.vercel-storage.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });
  const additionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) : [];
  const explicitlyAllowedOrigins = [
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    ...additionalOrigins
  ].filter(Boolean);
  app.use(
    (0, import_cors.default)({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        if (process.env.NODE_ENV !== "production") {
          if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
            return callback(null, true);
          }
        }
        if (explicitlyAllowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(
          new Error(`CORS blocked: Origin "${origin}" is not an authorized application origin.`),
          false
        );
      },
      credentials: true
    })
  );
  app.use((0, import_cookie_parser.default)());
  app.use(csrfProtection);
  app.use(import_express6.default.json({ limit: "10mb" }));
  app.use(import_express6.default.urlencoded({ extended: true, limit: "10mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      uptime: process.uptime(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "Getitresolved API"
    });
  });
  app.get("/api/ready", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const isProd = process.env.NODE_ENV === "production";
      const storageReady = !isProd || isBlobStorageConfigured();
      if (!storageReady) {
        res.status(503).json({
          status: "not_ready",
          database: "connected",
          storage: "missing_blob_token",
          error: "Production requires BLOB_READ_WRITE_TOKEN for durable private photo storage.",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        return;
      }
      try {
        assertAuthConfigured();
      } catch (authErr) {
        res.status(503).json({
          status: "not_ready",
          database: "connected",
          auth: "insecure_or_missing_secret",
          error: authErr.message || "Authentication misconfiguration in production.",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        return;
      }
      res.json({
        status: "ready",
        database: "connected",
        auth: "configured",
        storage: isBlobStorageConfigured() ? "durable_private_blob" : "local_disk",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      res.status(503).json({
        status: "not_ready",
        database: "disconnected",
        error: err.message || "Database connection error"
      });
    }
  });
  app.use("/api/auth", auth_default);
  app.use("/api/meta", meta_default);
  app.use("/api/complaints", complaints_default);
  app.use("/api/admin", admin_default);
  app.use("/api/stats", stats_default);
  app.get("/api", (_req, res) => {
    res.json({
      success: true,
      service: "Getitresolved Civic Management API",
      status: "operational",
      version: "1.0.0"
    });
  });
  app.all(["/api", "/api/*"], (_req, res) => {
    res.status(404).json({ success: false, error: "API endpoint not found" });
  });
  const clientDistPaths = [
    import_path3.default.resolve(process.cwd(), "dist/client"),
    import_path3.default.resolve(__dirname, "../../dist/client"),
    import_path3.default.resolve(__dirname, "../client")
  ];
  let clientDist = clientDistPaths.find((p) => import_fs4.default.existsSync(p));
  if (clientDist && import_fs4.default.existsSync(import_path3.default.join(clientDist, "index.html"))) {
    app.use(import_express6.default.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(import_path3.default.join(clientDist, "index.html"));
    });
  }
  app.use((err, _req, res, _next) => {
    console.error("[Unhandled Server Error]", err);
    if (res.headersSent) return;
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || "An unexpected internal server error occurred."
    });
  });
  return app;
}

// src/server/vercel-handler.ts
var appInstance = null;
function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}
function handler(req, res) {
  try {
    const app = getApp();
    const matchedPath = req.headers["x-matched-path"];
    if (matchedPath && matchedPath.startsWith("/api")) {
      const queryIndex = (req.url || "").indexOf("?");
      const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : "";
      req.url = matchedPath + queryString;
    } else if (req.url && !req.url.startsWith("/api")) {
      req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }
    return new Promise((resolve) => {
      res.on("finish", resolve);
      res.on("close", resolve);
      app(req, res);
    });
  } catch (err) {
    console.error("[Vercel Serverless Function Crash Caught]", err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === "production" ? "Server initialization error. Please verify database and security configuration." : err.message || "Server initialization failed"
      });
    }
  }
}
