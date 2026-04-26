# 🚨 Deployment Troubleshooting Guide

## Current Issues on Deployed Website

### 1. 500 Server Error on Login ❌
**Error**: `Server error during login`

### 2. CSP Violations ❌  
**Error**: Google Fonts blocked by Content Security Policy

---

## 🔧 Quick Fixes Applied

### ✅ Fixed CSP Headers
Updated `server/middleware/securityMiddleware.ts`:
```typescript
// New CSP policy allows Google Fonts
res.setHeader("Content-Security-Policy", 
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com data:; " +
  "connect-src 'self' https:; " +
  "img-src 'self' data: https:; " +
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com"
);
```

### ✅ Enhanced Error Handling
- Better database connection checks
- More detailed error logging
- Request validation

### ✅ Added Debug Endpoint
New endpoint: `/api/debug` to check deployment status

---

## 🔍 Debugging Steps

### Step 1: Check Environment Variables
Visit: `https://your-deployed-url.com/api/debug?force=true`

This will show:
- Database connection status
- Environment variables status
- Server configuration

### Step 2: Required Environment Variables
Make sure these are set in your deployment platform:

```env
MONGODB_URI=mongodb+srv://Hardik:Hardik1@cluster0.ezeb8ew.mongodb.net/?appName=Cluster0
JWT_SECRET=hanuram-foods-super-secret-jwt-key-256-bits-secure-2024
JWT_EXPIRES_IN=8h
ALLOWED_ORIGINS=https://your-deployed-url.com,http://localhost:5173,http://localhost:8080
NODE_ENV=production
PING_MESSAGE=ping
```

**⚠️ IMPORTANT**: Replace `https://your-deployed-url.com` with your actual deployment URL!

### Step 3: Platform-Specific Instructions

#### For Netlify:
1. Go to **Site Settings** → **Environment Variables**
2. Add all variables above
3. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist/spa`
   - Functions directory: `netlify/functions`

#### For Vercel:
1. Go to **Project Settings** → **Environment Variables**
2. Add all variables above
3. **Build Settings**:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist/spa`

#### For Railway:
1. Go to **Variables** tab
2. Add all variables above
3. Railway auto-detects Node.js apps

#### For Render:
1. Go to **Environment** tab
2. Add all variables above
3. **Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`

---

## 🧪 Testing After Deployment

### 1. Test Debug Endpoint
```bash
curl https://your-deployed-url.com/api/debug?force=true
```

Should return:
```json
{
  "success": true,
  "data": {
    "database": { "status": "connected" },
    "jwt": { "secret": "✅ Set" },
    "cors": { "allowedOrigins": "your-url" }
  }
}
```

### 2. Test Login
Try logging in with:
- Username: `admin`
- Password: `admin123`

### 3. Check Browser Console
- No more CSP violations for Google Fonts
- No 500 errors on login

---

## 🔧 Common Issues & Solutions

### Issue: Database Connection Failed
**Solution**: 
- Check MONGODB_URI is correct
- Ensure MongoDB Atlas allows connections from deployment platform
- Check MongoDB Atlas network access settings

### Issue: JWT Secret Missing
**Solution**: 
- Ensure JWT_SECRET environment variable is set
- Must be at least 32 characters long

### Issue: CORS Errors
**Solution**: 
- Add your deployment URL to ALLOWED_ORIGINS
- Format: `https://your-app.netlify.app,http://localhost:5173`

### Issue: CSP Violations
**Solution**: 
- ✅ Already fixed in latest code
- Redeploy to apply CSP changes

---

## 📞 Emergency Debugging

If issues persist:

1. **Check Deployment Logs**:
   - Look for database connection errors
   - Check for missing environment variables
   - Look for startup errors

2. **Test Locally**:
   ```bash
   npm run dev
   # Should work on http://localhost:8081
   ```

3. **Verify Environment Variables**:
   ```bash
   # In deployment platform console
   echo $MONGODB_URI
   echo $JWT_SECRET
   ```

4. **MongoDB Atlas Check**:
   - Network Access: Allow connections from anywhere (0.0.0.0/0)
   - Database Access: Ensure user has read/write permissions

---

## 🚀 Deployment Checklist

- [ ] All environment variables set
- [ ] ALLOWED_ORIGINS includes deployment URL
- [ ] MongoDB Atlas network access configured
- [ ] Build completes successfully
- [ ] `/api/debug` endpoint returns success
- [ ] Login works without 500 errors
- [ ] No CSP violations in browser console

---

**Last Updated**: After CSP and error handling fixes
**Status**: Ready for redeployment