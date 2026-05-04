# Security Audit Report
**Date**: April 25, 2026  
**Application**: Hanuram7 - Recipe & Raw Material Management System

---

## Executive Summary

This security audit identified **CRITICAL** and **HIGH** severity vulnerabilities that require immediate attention. The application has good security foundations (bcrypt, JWT, rate limiting) but contains hardcoded passwords and lacks proper authentication on critical endpoints.

**Risk Level**: 🔴 **HIGH**

---

## Critical Vulnerabilities

### 1. 🔴 CRITICAL: Hardcoded Passwords in Client-Side Code

**Severity**: CRITICAL  
**Impact**: Unauthorized data deletion, complete data loss  
**CVSS Score**: 9.1 (Critical)

**Affected Files**:
- `client/pages/CreateSubCategory.tsx` - Line 276: `const CLEAR_PASSWORD = "1212";`
- `client/pages/RMManagement.tsx` - Line 689: `const CLEAR_PASSWORD = "1212";`
- `client/pages/CreateUnit.tsx` - Line 249: `const CLEAR_PASSWORD = "1212";`
- `client/pages/CreateCategory.tsx` - Line 282: `const CLEAR_PASSWORD = "1212";`
- `client/pages/RMDetail.tsx` - Delete password: `"-1"`

**Description**:
Hardcoded passwords are stored in client-side JavaScript code, which is:
1. **Visible to anyone** who views the page source or network traffic
2. **Cannot be changed** without redeploying the application
3. **Same password** used across multiple deletion operations
4. **Trivial to bypass** - attackers can simply read the source code

**Exploitation**:
```javascript
// Attacker can simply read the source code:
// 1. Open browser DevTools
// 2. Search for "CLEAR_PASSWORD"
// 3. Find password "1212"
// 4. Delete all data
```

**Recommendation**:
```typescript
// REMOVE client-side password checks entirely
// IMPLEMENT server-side authentication instead

// Server-side (routes/categories.ts):
export const handleClearAllCategories: RequestHandler = async (req, res) => {
  // Verify JWT token
  const user = extractUser(req);
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized" 
    });
  }
  
  // Check admin permission
  const hasAccess = await hasPermission(user.role_id, "delete_all_categories");
  if (!hasAccess) {
    return res.status(403).json({ 
      success: false, 
      message: "Forbidden: Admin access required" 
    });
  }
  
  // Proceed with deletion
  // ... deletion logic
};
```

---

### 2. 🔴 CRITICAL: Missing Authentication on Destructive Endpoints

**Severity**: CRITICAL  
**Impact**: Unauthorized data manipulation  
**CVSS Score**: 9.8 (Critical)

**Affected Endpoints**:
- `DELETE /api/categories/clear/all` - No authentication required
- `DELETE /api/subcategories/clear/all` - No authentication required
- `DELETE /api/units/clear/all` - No authentication required
- `DELETE /api/raw-materials/clear/all` - No authentication required
- `DELETE /api/raw-materials/prices/clear/all` - No authentication required

**Description**:
Critical deletion endpoints lack authentication middleware. Anyone can send HTTP requests to delete all data without logging in.

**Exploitation**:
```bash
# Attacker can delete all data without authentication:
curl -X DELETE http://your-app.com/api/categories/clear/all
curl -X DELETE http://your-app.com/api/raw-materials/clear/all
```

**Recommendation**:
```typescript
// server/index.ts - Add authentication to all destructive routes:

import { requireAuth, requirePermission } from "./middleware/authMiddleware";

// Protected deletion routes
app.delete("/api/categories/clear/all", 
  requireAuth, 
  requirePermission("admin"), 
  handleClearAllCategories
);

app.delete("/api/subcategories/clear/all", 
  requireAuth, 
  requirePermission("admin"), 
  handleClearAllSubCategories
);

app.delete("/api/units/clear/all", 
  requireAuth, 
  requirePermission("admin"), 
  handleClearAllUnits
);

app.delete("/api/raw-materials/clear/all", 
  requireAuth, 
  requirePermission("admin"), 
  handleClearAllRawMaterials
);
```

---

## High Severity Vulnerabilities

### 3. 🟠 HIGH: Weak Password Policy

**Severity**: HIGH  
**Impact**: Account compromise  
**CVSS Score**: 7.5 (High)

**Location**: `server/routes/login.ts`

**Description**:
- No password complexity requirements enforced
- Supports legacy plain-text passwords (backward compatibility)
- No password expiration policy
- No account lockout after failed attempts (only IP-based rate limiting)

**Current Implementation**:
```typescript
// Accepts ANY password, no complexity check
if (user.password.startsWith("$2")) {
  // bcrypt hash
  passwordValid = await bcrypt.compare(password, user.password);
} else {
  // Plain text (legacy) - SECURITY RISK
  passwordValid = user.password === password;
}
```

**Recommendation**:
```typescript
// 1. Enforce password policy on user creation/update
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 12) {
    return { valid: false, message: "Password must be at least 12 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain number" };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, message: "Password must contain special character" };
  }
  return { valid: true };
}

// 2. Remove plain-text password support
// 3. Implement password expiration (90 days)
// 4. Add account lockout after 5 failed attempts
```

---

### 4. 🟠 HIGH: Insufficient Rate Limiting

**Severity**: HIGH  
**Impact**: Brute force attacks, DoS  
**CVSS Score**: 7.2 (High)

**Location**: `server/routes/login.ts`

**Description**:
- Login rate limiting: 10 attempts per 15 minutes per IP
- Can be bypassed using multiple IPs (VPN, proxy, botnet)
- No account-level rate limiting
- No CAPTCHA after failed attempts

**Current Implementation**:
```typescript
const MAX_ATTEMPTS = 10;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
```

**Recommendation**:
```typescript
// Implement multi-layer rate limiting:

// 1. IP-based (existing): 10 attempts per 15 min
// 2. Account-based: 5 attempts per 30 min
// 3. Global: 1000 login attempts per minute across all IPs

// Add to user document:
interface User {
  failedLoginAttempts: number;
  lastFailedLogin: Date;
  accountLockedUntil?: Date;
}

// Implement account lockout:
if (user.failedLoginAttempts >= 5) {
  const lockoutTime = 30 * 60 * 1000; // 30 minutes
  if (Date.now() - user.lastFailedLogin.getTime() < lockoutTime) {
    return res.status(429).json({
      success: false,
      message: "Account temporarily locked due to multiple failed attempts"
    });
  }
}

// Add CAPTCHA after 3 failed attempts
```

---

### 5. 🟠 HIGH: NoSQL Injection Risk

**Severity**: HIGH  
**Impact**: Data breach, unauthorized access  
**CVSS Score**: 7.8 (High)

**Location**: Multiple route handlers

**Description**:
While MongoDB driver provides some protection, user input is not consistently sanitized before database queries. The `preventNoSQLInjection` function exists but is not used in route handlers.

**Vulnerable Pattern**:
```typescript
// Potentially vulnerable to NoSQL injection
const user = await db.collection("users").findOne({ 
  username: username.trim() // No sanitization
});

// Attacker could send:
// username: { "$ne": null }
// This would match ANY user
```

**Recommendation**:
```typescript
import { preventNoSQLInjection } from "./middleware/securityMiddleware";

// Apply to ALL user inputs before database queries:
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    // Sanitize inputs
    const sanitizedBody = preventNoSQLInjection(req.body);
    const { username, password } = sanitizedBody;
    
    // Validate types
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid input types" 
      });
    }
    
    // Proceed with query
    const user = await db.collection("users").findOne({ 
      username: username.trim() 
    });
    // ...
  } catch (error) {
    // Handle injection attempts
    if (error.message.includes("malicious")) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid input" 
      });
    }
  }
};
```

---

## Medium Severity Vulnerabilities

### 6. 🟡 MEDIUM: Sensitive Data Exposure in Logs

**Severity**: MEDIUM  
**Impact**: Information disclosure  
**CVSS Score**: 5.3 (Medium)

**Location**: `server/routes/login.ts`, console logs throughout

**Description**:
- Login failures log usernames
- Console logs may contain sensitive data
- No log sanitization

**Recommendation**:
```typescript
// Implement structured logging with sanitization
import winston from "winston";

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" })
  ]
});

// Sanitize before logging
logger.info("Login attempt", { 
  username: sanitizeForLog(username), // Mask sensitive parts
  ip: req.ip,
  success: false
});
```

---

### 7. 🟡 MEDIUM: Missing HTTPS Enforcement

**Severity**: MEDIUM  
**Impact**: Man-in-the-middle attacks  
**CVSS Score**: 5.9 (Medium)

**Location**: `server/index.ts`

**Description**:
- No HTTPS enforcement in code
- HSTS header set but not enforced
- Credentials transmitted over potentially insecure connections

**Recommendation**:
```typescript
// Add HTTPS redirect middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// Strengthen HSTS
res.setHeader(
  "Strict-Transport-Security", 
  "max-age=63072000; includeSubDomains; preload"
);
```

---

### 8. 🟡 MEDIUM: Weak CORS Configuration

**Severity**: MEDIUM  
**Impact**: Unauthorized cross-origin requests  
**CVSS Score**: 5.4 (Medium)

**Location**: `server/index.ts` - Line 147

**Current Configuration**:
```typescript
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || 
            ["http://localhost:5173", "http://localhost:8080"],
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);
```

**Issues**:
- Fallback to localhost if `ALLOWED_ORIGINS` not set
- No origin validation
- Credentials disabled (good) but should be explicit

**Recommendation**:
```typescript
// Strict CORS with validation
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

if (allowedOrigins.length === 0 && process.env.NODE_ENV === "production") {
  throw new Error("ALLOWED_ORIGINS must be set in production");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: false, // Explicitly disable
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);
```

---

### 9. 🟡 MEDIUM: JWT Token Expiration Too Long

**Severity**: MEDIUM  
**Impact**: Extended unauthorized access if token stolen  
**CVSS Score**: 5.1 (Medium)

**Location**: `server/routes/login.ts`

**Current Configuration**:
```typescript
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
```

**Issues**:
- 8 hours is too long for a web application
- No refresh token mechanism
- No token revocation

**Recommendation**:
```typescript
// Implement short-lived access tokens + refresh tokens
const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // 7 days

// Generate both tokens on login
const accessToken = jwt.sign(
  { id: user._id, username: user.username, role_id: user.role_id },
  getJWTSecret(),
  { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
);

const refreshToken = jwt.sign(
  { id: user._id, type: "refresh" },
  getRefreshTokenSecret(),
  { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
);

// Store refresh token in database for revocation
await db.collection("refresh_tokens").insertOne({
  userId: user._id,
  token: refreshToken,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

// Add refresh endpoint
app.post("/api/refresh", async (req, res) => {
  // Validate refresh token and issue new access token
});
```

---

## Low Severity Issues

### 10. 🟢 LOW: Missing Security Headers

**Severity**: LOW  
**Impact**: Defense in depth  

**Missing Headers**:
- `Referrer-Policy`
- `Permissions-Policy`
- `X-Permitted-Cross-Domain-Policies`

**Recommendation**:
```typescript
res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
```

---

### 11. 🟢 LOW: No Input Length Validation

**Severity**: LOW  
**Impact**: DoS, buffer overflow  

**Location**: Various route handlers

**Recommendation**:
```typescript
// Add to securityMiddleware.ts
export function validateFieldLength(
  field: string, 
  value: string, 
  maxLength: number
): boolean {
  if (value.length > maxLength) {
    throw new Error(`Field "${field}" exceeds maximum length of ${maxLength}`);
  }
  return true;
}
```

---

## Positive Security Findings ✅

The application implements several good security practices:

1. ✅ **Password Hashing**: Uses bcrypt with cost factor 12
2. ✅ **JWT Authentication**: Proper JWT implementation
3. ✅ **Rate Limiting**: Basic rate limiting on login endpoint
4. ✅ **Security Headers**: Basic security headers implemented
5. ✅ **Input Validation**: Some input validation exists
6. ✅ **Login Attempt Tracking**: Logs login attempts to database
7. ✅ **RBAC System**: Role-based access control framework exists
8. ✅ **Soft Delete**: Uses soft delete for raw materials

---

## Remediation Priority

### Immediate (Within 24 hours):
1. 🔴 Remove all hardcoded passwords from client-side code
2. 🔴 Add authentication middleware to all deletion endpoints
3. 🔴 Implement server-side authorization for destructive operations

### Short-term (Within 1 week):
4. 🟠 Implement stronger password policy
5. 🟠 Add account-level rate limiting
6. 🟠 Apply NoSQL injection prevention to all routes
7. 🟡 Enforce HTTPS in production
8. 🟡 Implement proper CORS validation

### Medium-term (Within 1 month):
9. 🟡 Implement refresh token mechanism
10. 🟡 Add structured logging with sanitization
11. 🟢 Add missing security headers
12. 🟢 Implement comprehensive input validation

---

## Testing Recommendations

1. **Penetration Testing**: Conduct professional penetration testing
2. **Security Scanning**: Use tools like:
   - OWASP ZAP
   - Burp Suite
   - npm audit
   - Snyk
3. **Code Review**: Regular security-focused code reviews
4. **Dependency Scanning**: Monitor for vulnerable dependencies

---

## Compliance Considerations

- **GDPR**: Ensure proper data protection and user consent
- **PCI DSS**: If handling payment data, ensure compliance
- **SOC 2**: Consider SOC 2 compliance for enterprise customers
- **Data Retention**: Implement data retention policies

---

## Conclusion

The application requires **immediate attention** to critical vulnerabilities, particularly:
- Hardcoded passwords in client code
- Missing authentication on destructive endpoints

Once these are addressed, focus on implementing defense-in-depth strategies including stronger authentication, comprehensive input validation, and proper logging.

**Estimated Remediation Time**: 2-3 weeks for critical and high severity issues

---

**Report Generated**: April 25, 2026  
**Auditor**: Kiro AI Security Audit  
**Next Review**: Recommended within 3 months after remediation
