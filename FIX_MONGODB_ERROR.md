# ⚠️ FIX: MongoDB Connection Error in Render

## Problem:
Your backend is trying to connect to `localhost:27017` instead of MongoDB Atlas because the environment variables aren't set in Render yet.

## ✅ Solution: Add Environment Variables in Render

### Step-by-Step:

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Select your service: `campaign-poster-api`

2. **Navigate to Environment Tab:**
   - Click on "Environment" in the left menu
   - You'll see a list of environment variables

3. **Add These Variables:**

   Click "Add Environment Variable" for each one:

   ```
   Key: MONGODB_URI
   Value: mongodb+srv://dprobahaudheen_db_user:cMgIyCbz6RoQFEs0@cluster0.pdfxetb.mongodb.net/campaign-poster-saas?retryWrites=true&w=majority
   ```

   ```
   Key: CLOUDINARY_CLOUD_NAME
   Value: dwj37dksy
   ```

   ```
   Key: CLOUDINARY_API_KEY
   Value: 176643644418311
   ```

   ```
   Key: CLOUDINARY_API_SECRET
   Value: KWPDGgLalMs_GtUWp7vYEOvdjno
   ```

   ```
   Key: PORT
   Value: 5000
   ```

   ```
   Key: NODE_ENV
   Value: production
   ```

   ```
   Key: CORS_ORIGIN
   Value: *
   ```

4. **Save Changes:**
   - Click "Save Changes" button at the bottom

5. **Redeploy:**
   - Go back to "Overview" tab
   - Click "Manual Deploy" → "Deploy latest commit"
   - Or wait, it should auto-redeploy

6. **Wait for Deployment:**
   - Wait 3-5 minutes for the deployment to complete
   - Check the logs to see if it connects successfully

7. **Test It:**
   - Visit: `https://YOUR-BACKEND.onrender.com/api/health`
   - Should show: `{"status":"OK","message":"Server is running"}`

---

## 🔍 Why This Happens:

The `.env` file is in `.gitignore` for security reasons (you don't want passwords in GitHub). 

Render requires you to add environment variables through their dashboard, which is actually more secure!

---

## 📋 Quick Copy-Paste Values:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://dprobahaudheen_db_user:cMgIyCbz6RoQFEs0@cluster0.pdfxetb.mongodb.net/campaign-poster-saas?retryWrites=true&w=majority` |
| `CLOUDINARY_CLOUD_NAME` | `dwj37dksy` |
| `CLOUDINARY_API_KEY` | `176643644418311` |
| `CLOUDINARY_API_SECRET` | `KWPDGgLalMs_GtUWp7vYEOvdjno` |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `*` |

---

## ✅ After Adding Variables:

Once you've added all the environment variables and saved:

1. The service will automatically redeploy
2. Check the logs - you should see "Connected to MongoDB"
3. Test the health endpoint
4. Continue with deploying frontend to Vercel!

**Next step after this works:** Deploy frontend to Vercel (see `STEP_1_COMPLETE.md`)
