# Deployment Guide

## 🚀 Quick Fix for Current Issues

### 1. Environment Variables for Production

Make sure these environment variables are set in your deployment platform:

```env
MONGODB_URI=mongodb+srv://Hardik:Hardik1@cluster0.ezeb8ew.mongodb.net/?appName=Cluster0
JWT_SECRET=hanuram-foods-super-secret-jwt-key-256-bits-secure-2024
JWT_EXPIRES_IN=8h
ALLOWED_ORIGINS=https://your-deployed-domain.com,http://localhost:5173,http://localhost:8080
PING_MESSAGE=ping
NODE_ENV=production
```

**Replace `https://your-deployed-domain.com` with your actual deployed URL**

### 2. Common Deployment Platforms

#### Netlify:
1. Go to Site Settings → Environment Variables
2. Add all the environment variables above
3. Make sure `ALLOWED_ORIGINS` includes your Netlify URL

#### Vercel:
1. Go to Project Settings → Environment Variables
2. Add all the environment variables above
3. Make sure `ALLOWED_ORIGINS` includes your Vercel URL

#### Railway/Render:
1. Go to Environment Variables section
2. Add all the environment variables above
3. Make sure `ALLOWED_ORIGINS` includes your platform URL

### 3. Build Commands

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the application
npm start
```

### 4. Port Configuration

The application will use `process.env.PORT` or default to `8080`. Most deployment platforms automatically set the PORT environment variable.

## 🔧 Fixes Applied

### Fixed Content Security Policy
- ✅ Added Google Fonts support
- ✅ Updated CSP headers to allow fonts.googleapis.com and fonts.gstatic.com

### Enhanced Error Handling
- ✅ Better login error logging
- ✅ More detailed error messages in development
- ✅ Improved database connection error handling

### Security Improvements
- ✅ Environment-based error reporting
- ✅ Better IP address handling for proxied requests
- ✅ Enhanced CORS configuration

## 🐛 Troubleshooting

### 500 Error on Login
1. **Check MongoDB Connection**: Ensure MONGODB_URI is correct
2. **Check Environment Variables**: All required env vars must be set
3. **Check Logs**: Look for specific error messages in deployment logs
4. **Database Access**: Ensure MongoDB Atlas allows connections from your deployment platform

### CSP Violations
- ✅ Fixed: Google Fonts now allowed in CSP headers

### CORS Issues
- Ensure your deployment URL is in ALLOWED_ORIGINS environment variable

## 📋 Deployment Checklist

- [ ] Set all environment variables
- [ ] Update ALLOWED_ORIGINS with your deployment URL
- [ ] Ensure MongoDB Atlas allows connections from deployment platform
- [ ] Test database connection
- [ ] Verify build process completes successfully
- [ ] Test login functionality after deployment

## 🔍 Debug Commands

To test locally after fixes:
```bash
npm run dev
```

To check if environment variables are loaded:
```bash
# In your deployment platform logs, look for:
# "✅ MongoDB connection established"
# "✅ Connected to MongoDB"
```

## 📞 Support

If issues persist:
1. Check deployment platform logs
2. Verify all environment variables are set correctly
3. Test MongoDB connection separately
4. Ensure your deployment URL is in ALLOWED_ORIGINS