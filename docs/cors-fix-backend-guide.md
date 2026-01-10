# CORS Fix for Authenticated GET Requests - Backend Implementation Guide

## 🎯 Objective

Fix CORS configuration so authenticated GET requests for flashcards cards are allowed. The browser must be able to send authenticated requests after successful preflight.

---

## 📍 Files to Modify

Locate your main Express server file (typically one of these):
- `server.js`
- `app.js`
- `index.js`
- `src/server.js`
- `src/index.js`

---

## ✅ Required Changes

### 1. Ensure CORS Middleware Runs BEFORE Auth Middleware

**Critical:** CORS middleware MUST be registered before any authentication/JWT middleware.

**Wrong Order (❌):**
```javascript
// ❌ WRONG - Auth before CORS
app.use(authenticateJWT);  // Blocks preflight requests
app.use(cors());
```

**Correct Order (✅):**
```javascript
// ✅ CORRECT - CORS before auth
app.use(cors({ /* config */ }));
app.use(authenticateJWT);
```

---

### 2. Replace Static Origin with Dynamic Origin Function

**Replace any existing CORS configuration with this:**

```javascript
const cors = require('cors');

// Define allowed origins
const allowedOrigins = [
  "https://synapse-app.io",
  "http://localhost:3000"
];

// CORS configuration with dynamic origin echoing
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
```

---

### 3. Explicitly Enable OPTIONS Preflight

Add this AFTER the CORS middleware:

```javascript
// Explicitly handle OPTIONS preflight requests
app.options("*", cors());
```

---

## 📝 Complete Example: Express Server Setup

Here's a complete example showing the correct middleware order:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// ============================================
// 1. CORS MIDDLEWARE (MUST BE FIRST)
// ============================================
const allowedOrigins = [
  "https://synapse-app.io",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Explicitly handle OPTIONS preflight requests
app.options("*", cors());

// ============================================
// 2. BODY PARSING MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// 3. AUTHENTICATION MIDDLEWARE (AFTER CORS)
// ============================================
app.use(authenticateJWT);  // Your JWT auth middleware

// ============================================
// 4. ROUTES
// ============================================
app.get('/flashcards/decks/:id/cards', async (req, res) => {
  // Your flashcard cards endpoint
  // ...
});

// ... other routes
```

---

## ⚠️ Critical Rules

### ❌ DO NOT:

1. **DO NOT use `origin: "*"` with `credentials: true`**
   ```javascript
   // ❌ WRONG - Browser will reject this
   app.use(cors({
     origin: "*",
     credentials: true  // Incompatible!
   }));
   ```

2. **DO NOT run auth middleware before CORS**
   ```javascript
   // ❌ WRONG - Preflight requests will be blocked
   app.use(authenticateJWT);
   app.use(cors());
   ```

3. **DO NOT use static origin string if you need credentials**
   ```javascript
   // ❌ WRONG - Won't echo origin properly
   app.use(cors({
     origin: "https://synapse-app.io",
     credentials: true
   }));
   ```

### ✅ DO:

1. **Use dynamic origin function** (as shown above)
2. **Place CORS before auth middleware**
3. **Enable OPTIONS explicitly**
4. **Include all necessary methods and headers**

---

## 🔍 Verification

After implementing, test with:

1. **Browser DevTools → Network Tab:**
   - Open flashcards page
   - Look for `OPTIONS /flashcards/decks/:id/cards` request
   - Should return `200 OK` with CORS headers
   - Then `GET /flashcards/decks/:id/cards` should succeed

2. **Check Response Headers:**
   ```
   Access-Control-Allow-Origin: https://synapse-app.io
   Access-Control-Allow-Credentials: true
   Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```

3. **Console Errors:**
   - Should see NO CORS errors in browser console
   - Flashcard cards should load successfully

---

## 🚀 Next Steps

1. **Locate your Express server file**
2. **Find existing CORS configuration** (if any)
3. **Move CORS middleware to the top** (before auth)
4. **Replace with dynamic origin function** (as shown above)
5. **Add explicit OPTIONS handler**
6. **Test with browser DevTools**

---

## 📚 Additional Notes

### Environment-Specific Origins

If you need different origins for different environments:

```javascript
const allowedOrigins = [
  "https://synapse-app.io",
  "https://staging.synapse-app.io",
  "http://localhost:3000",
  "http://localhost:5173",  // Vite dev server
];

// Or from environment variable:
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  "https://synapse-app.io",
  "http://localhost:3000"
];
```

### Debugging CORS Issues

If CORS still fails after these changes:

1. **Check browser console** for specific CORS error message
2. **Verify preflight (OPTIONS) request** succeeds
3. **Check Network tab** for actual vs. expected headers
4. **Verify origin** matches exactly (no trailing slashes)
5. **Ensure credentials: true** is set on both frontend and backend

---

**End of Implementation Guide**

