# Frontend Troubleshooting Guide

## 🔴 Issue: 404 Error - Failed to load resource

### **Problem**
You're seeing this error in the console:
```
:5500/api/hotels:1 Failed to load resource: the server responded with a status of 404 (Not Found)
```

### **Root Cause**
The frontend is running on port 5500 (Live Server) but trying to access `/api/hotels` which resolves to `http://localhost:5500/api/hotels` instead of the actual API server at `https://localhost:7000/api/hotels`.

### **✅ Solution Applied**

I've fixed this by updating the configuration to automatically detect the port and use the correct API URL:

**File: `wwwroot/js/config.js`**
```javascript
baseURL: (() => {
    const port = window.location.port;
    // If running on Live Server, use full API URL
    if (port === '5500' || port === '5501' || port === '3000') {
        return 'https://localhost:7000/api';
    }
    // If served from API, use relative URL
    return '/api';
})()
```

---

## 🚀 How to Run (Step by Step)

### **Step 1: Start the API**

```bash
cd finaldestination
dotnet run
```

Wait for this message:
```
Now listening on: https://localhost:7000
```

### **Step 2: Verify API is Running**

Open in browser: `https://localhost:7000`

You should see the Swagger UI interface.

### **Step 3: Open the Frontend**

**Option A: From API (Recommended)**
- Just go to `https://localhost:7000`
- The frontend is automatically served

**Option B: Using Live Server**
- Right-click `wwwroot/index.html`
- Select "Open with Live Server"
- It will automatically use `https://localhost:7000/api`

---

## 🔧 Diagnostic Tool

I've created a diagnostic page to help troubleshoot:

**Open**: `http://localhost:5500/diagnostic.html` (if using Live Server)
**Or**: `https://localhost:7000/diagnostic.html` (if served from API)

This tool will:
- ✅ Show your current configuration
- ✅ Test API connectivity
- ✅ Test specific endpoints
- ✅ Provide helpful error messages

---

## ⚠️ Common Issues & Solutions

### **Issue 1: SSL Certificate Warning**

**Error**: "Your connection is not private" or "NET::ERR_CERT_AUTHORITY_INVALID"

**Solution**:
```bash
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```

Then restart your browser.

---

### **Issue 2: CORS Error**

**Error**: "Access to fetch at 'https://localhost:7000/api/hotels' from origin 'http://localhost:5500' has been blocked by CORS policy"

**Solution**: The API already has CORS enabled. Make sure:
1. API is running in Development mode
2. You're using the correct API URL
3. Restart the API if needed

---

### **Issue 3: API Not Running**

**Error**: "Cannot connect to API" or "Failed to fetch"

**Solution**:
1. Start the API: `cd finaldestination && dotnet run`
2. Verify it's running: Open `https://localhost:7000`
3. Check for port conflicts

---

### **Issue 4: Wrong Port**

**Error**: API calls going to wrong port

**Solution**: The config now auto-detects the port. If you're using a custom port, update `config.js`:

```javascript
if (port === '5500' || port === '5501' || port === 'YOUR_PORT') {
    return 'https://localhost:7000/api';
}
```

---

## 📝 Test Accounts

Use these to test the application:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@hotel.com | Admin123! |
| **Hotel Manager** | manager@hotel.com | Manager123! |
| **Guest** | guest@example.com | Guest123! |

---

## 🎯 Quick Checklist

Before reporting issues, verify:

- [ ] API is running (`dotnet run`)
- [ ] API is accessible at `https://localhost:7000`
- [ ] Swagger UI loads successfully
- [ ] SSL certificate is trusted
- [ ] Browser console shows the correct API URL
- [ ] No firewall blocking localhost connections

---

## 🔍 Debugging Steps

### **1. Check API Status**

```bash
# In terminal
curl https://localhost:7000/api/hotels
```

Should return JSON with hotel data.

### **2. Check Browser Console**

Press F12 and look for:
- Red errors
- Network tab showing failed requests
- The actual URL being called

### **3. Check API Console**

Look for:
- Incoming requests
- Error messages
- CORS warnings

### **4. Test with Diagnostic Tool**

Open `diagnostic.html` and run all tests.

---

## 💡 Best Practices

### **For Development**

1. **Always start API first**
2. **Use the diagnostic tool** to verify connectivity
3. **Check browser console** for errors
4. **Use Swagger UI** to test API endpoints directly

### **For Production**

1. **Serve frontend from API** (not Live Server)
2. **Use relative URLs** (automatic when served from API)
3. **Enable HTTPS** with proper certificates
4. **Configure CORS** for your production domain

---

## 📞 Still Having Issues?

1. **Run the diagnostic tool**: `diagnostic.html`
2. **Check all logs**: Browser console + API console
3. **Verify ports**: API on 7000, frontend on 5500 or 7000
4. **Try the recommended setup**: Serve from API (Option A)
5. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)

---

## ✅ Verification

Your setup is working correctly when:

1. ✅ API runs without errors
2. ✅ Swagger UI loads at `https://localhost:7000`
3. ✅ Frontend loads without console errors
4. ✅ Hotels display on the homepage
5. ✅ You can login successfully
6. ✅ All features work (booking, reviews, etc.)

---

**Current Status**: ✅ **FIXED**

The configuration has been updated to automatically detect the port and use the correct API URL. Just make sure the API is running on `https://localhost:7000` before opening the frontend!
