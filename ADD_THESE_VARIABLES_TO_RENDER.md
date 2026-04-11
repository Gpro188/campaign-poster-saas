# 🚨 URGENT: Add Environment Variables NOW!

## Problem:
Render shows: `[dotenv@17.3.1] injecting env (0) from .env`

This means **ZERO environment variables** are set in Render!

---

## ✅ FIX THIS NOW - Follow These Exact Steps:

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Login with GitHub
3. Click on your service: **campaign-poster-api**

### Step 2: Go to Environment Tab
- On the left sidebar, click **"Environment"**
- You'll see an empty list or existing variables

### Step 3: Add ALL These Variables (Copy-Paste Each One)

Click **"Add Environment Variable"** button and add each one:

---

**Variable 1:**
```
Key: MONGODB_URI
Value: mongodb+srv://dprobahaudheen_db_user:cMgIyCbz6RoQFEs0@cluster0.pdfxetb.mongodb.net/campaign-poster-saas?retryWrites=true&w=majority
```

**Variable 2:**
```
Key: CLOUDINARY_CLOUD_NAME
Value: dwj37dksy
```

**Variable 3:**
```
Key: CLOUDINARY_API_KEY
Value: 176643644418311
```

**Variable 4:**
```
Key: CLOUDINARY_API_SECRET
Value: KWPDGgLalMs_GtUWp7vYEOvdjno
```

**Variable 5:**
```
Key: PORT
Value: 5000
```

**Variable 6:**
```
Key: NODE_ENV
Value: production
```

**Variable 7:**
```
Key: CORS_ORIGIN
Value: *
```

---

### Step 4: Save!
- Scroll down
- Click **"Save Changes"** button

### Step 5: Wait for Redeploy
- Render will automatically redeploy
- Wait 3-5 minutes
- Check the logs

### Step 6: Test It!
Visit: `https://YOUR-BACKEND-URL.onrender.com/api/health`

Should show: `{"status":"OK","message":"Server is running"}`

---

## 📋 Quick Reference Table (Copy from Here):

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://dprobahaudheen_db_user:cMgIyCbz6RoQFEs0@cluster0.pdfxetb.mongodb.net/campaign-poster-saas?retryWrites=true&w=majority` |
| `CLOUDINARY_CLOUD_NAME` | `dwj37dksy` |
| `CLOUDINARY_API_KEY` | `176643644418311` |
| `CLOUDINARY_API_SECRET` | `KWPDGgLalMs_GtUWp7vYEOvdjno` |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `*` |

---

## ⚠️ IMPORTANT NOTES:

1. **Don't skip any variable** - Add ALL 7 variables
2. **Copy exactly** - No spaces before/after the value
3. **Case sensitive** - Use exact capitalization shown
4. **Save after adding all** - Don't save after each one

---

## 🔍 Why "injecting env (0)"?

The `.env` file is NOT in GitHub (it's in `.gitignore` for security).

You MUST manually add environment variables in Render's dashboard.

This is actually MORE secure because:
- Passwords never stored in Git
- Only you can see them in Render dashboard
- Different environments can have different values

---

## ✅ After You Add Variables:

Once deployed successfully, you should see in logs:
```
Connected to MongoDB
Server running on port 5000
```

Then continue to next step: Deploy frontend to Vercel!

See: `STEP_1_COMPLETE.md` for remaining steps.
