# Production Auth Crash Fix - Minimal Changes Required

**Issue**: React error #300 after OTP login  
**Root Cause**: Wrong localStorage key + missing Supabase session setup  
**File to Fix**: `src/components/auth/VerifyOtp.jsx`

---

## THE FIX

### Change 1: Add Import (Line 4)

**Current**:
```javascript
import React, { useEffect, useRef, useState } from "react";
import LegalModal from "../LegalModal";
import AppLogo from "../AppLogo";
```

**Add**:
```javascript
import React, { useEffect, useRef, useState } from "react";
import LegalModal from "../LegalModal";
import AppLogo from "../AppLogo";
import { supabase } from "../../lib/supabaseClient";  // ← ADD THIS LINE
```

---

### Change 2: Fix Token Storage (Lines 88-94)

**Current (BROKEN)**:
```javascript
// 3️⃣ Save token
localStorage.setItem(
    "token",
    loginJson.data.session.access_token
);

onVerified();
```

**Replace With (FIXED)**:
```javascript
// 3️⃣ Save token and set Supabase session
const { access_token, refresh_token } = loginJson.data.session;

// Store in localStorage with correct key
localStorage.setItem("access_token", access_token);

// Set Supabase session so auth state listeners trigger
await supabase.auth.setSession({
    access_token,
    refresh_token
});

// Now safe to proceed - onAuthStateChange will fire
onVerified();
```

---

## EXACT STRING REPLACEMENT

**Old String** (lines 88-94):
```javascript
            // 3️⃣ Save token
            localStorage.setItem(
                "token",
                loginJson.data.session.access_token
            );

            onVerified();
```

**New String**:
```javascript
            // 3️⃣ Save token and set Supabase session
            const { access_token, refresh_token } = loginJson.data.session;

            // Store in localStorage with correct key
            localStorage.setItem("access_token", access_token);

            // Set Supabase session so auth state listeners trigger
            await supabase.auth.setSession({
                access_token,
                refresh_token
            });

            // Now safe to proceed - onAuthStateChange will fire
            onVerified();
```

---

## WHY THIS FIXES THE CRASH

### Bug #1: Wrong localStorage Key

**Problem**:
```javascript
localStorage.setItem("token", ...)         // VerifyOtp stores here
localStorage.getItem("access_token")       // App.jsx reads here
```

**Result**: API calls fail (no token found)

**Fix**: Use `"access_token"` consistently

---

### Bug #2: Missing Supabase Session

**Problem**:
```javascript
// After OTP login:
supabase.auth.getSession() → returns NULL
supabase.auth.getUser() → returns NULL
```

**Result**: 
- `fetchProfile()` returns early (line 504: `if (!user) return`)
- `profile` stays null
- Dashboard renders with null profile
- Components crash

**Fix**: Call `supabase.auth.setSession()` to initialize Supabase client

---

## VALIDATION STEPS

### After Applying Fix

1. **Clear localStorage**:
   ```javascript
   localStorage.clear()
   ```

2. **Test OTP flow**:
   - Sign up with new email
   - Enter OTP
   - Verify redirect works

3. **Check console**:
   ```javascript
   localStorage.getItem("access_token")  // Should return token
   localStorage.getItem("token")         // Should be null
   ```

4. **Verify session**:
   ```javascript
   // In browser console:
   (await supabase.auth.getSession()).data.session  // Should return session object
   ```

5. **Check dashboard**:
   - No blank screen
   - No React error
   - Profile displays in header

---

## NO OTHER CHANGES NEEDED

- ✅ App.jsx auth logic is correct
- ✅ Dashboard components have null guards
- ✅ Login.jsx works correctly (uses Supabase directly)
- ✅ Session sync useEffect is correct

**Only VerifyOtp.jsx needs fixing.**

---

## DEPLOYMENT CHECKLIST

- [ ] Apply fix to `VerifyOtp.jsx`
- [ ] Test signup flow in dev
- [ ] Test OTP verification
- [ ] Verify dashboard renders
- [ ] Clear localStorage in production (users with "token" key)
- [ ] Deploy to production
- [ ] Monitor error logs for React error #300

---

**Total Changes**: 1 file, 1 import added, 8 lines replaced

**Risk Level**: LOW (isolated fix, no architectural changes)

---

**End of Fix Document**
