# 🚀 DEPLOYMENT START HERE

## Quick Start - Follow These Steps

### Step 1: Create Required Accounts (5 minutes)

Go to each link and sign up for FREE:

1. **MongoDB Atlas** (Database)
   - Link: https://www.mongodb.com/cloud/atlas/register
   - Choose: FREE tier (M0)
   - Save username and password!

2. **Cloudinary** (Image Storage)
   - Link: https://cloudinary.com/users/register/free
   - Choose: Free plan
   - Copy from Dashboard:
     - Cloud Name
     - API Key  
     - API Secret

3. **Render.com** (Backend Hosting)
   - Link: https://dashboard.render.com/register
   - Choose: Free plan

4. **Vercel** (Frontend Hosting)
   - Link: https://vercel.com/signup
   - Choose: Free plan

5. **GitHub** (Code Repository) - if you don't have
   - Link: https://github.com/signup
   - Free account

---

### Step 2: Get Your MongoDB Connection String (3 minutes)

1. Login to MongoDB Atlas
2. Click "Build a Database" → Choose FREE (M0)
3. Click "Create"
4. Go to "Database Access" → Add User
   - Username: `admin`
   - Password: (create strong password, SAVE IT!)
5. Go to "Network Access" → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
6. Go to "Database" → Connect
7. Choose "Connect your application"
8. Copy connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
9. Replace `<password>` with your actual password
10. Change `/?retryWrites` to `/campaign-poster-saas?retryWrites`

**SAVE THIS CONNECTION STRING!**

---

### Step 3: Setup Backend Environment (2 minutes)

1. Open folder: `server`
2. Copy `.env.example` to `.env`
3. Edit `.env` file:

```env
# Replace these with YOUR actual values

MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/campaign-poster-saas?retryWrites=true&w=majority

CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

PORT=5000
NODE_ENV=production
CORS_ORIGIN=*
```

**IMPORTANT:** 
- Replace `YOUR_PASSWORD` with MongoDB password
- Replace Cloudinary values from your dashboard
- Don't worry about CORS_ORIGIN now, we'll update later

---

### Step 4: Push Code to GitHub (5 minutes)

Open PowerShell in this folder and run:

```powershell
# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create GitHub repo first at: https://github.com/new
# Then connect and push:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/campaign-poster-saas.git
git push -u origin main
```

**Write down your GitHub repo URL!**

---

### Step 5: Deploy Backend to Render (10 minutes)

1. Login to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `campaign-poster-api`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: `Free`

5. Click "Advanced" and add Environment Variables:
   ```
   MONGODB_URI = (paste your MongoDB connection string)
   CLOUDINARY_CLOUD_NAME = (from Cloudinary dashboard)
   CLOUDINARY_API_KEY = (from Cloudinary dashboard)
   CLOUDINARY_API_SECRET = (from Cloudinary dashboard)
   PORT = 5000
   NODE_ENV = production
   CORS_ORIGIN = *
   ```

6. Click "Create Web Service"
7. Wait 5-10 minutes for deployment
8. Copy your backend URL (e.g., `https://campaign-poster-api.onrender.com`)

**TEST IT:** Visit `https://YOUR-BACKEND-URL.onrender.com/api/health`
Should show: `{"status":"OK","message":"Server is running"}`

---

### Step 6: Deploy Frontend to Vercel (5 minutes)

1. Login to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `client`
   
5. Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_API_URL = https://YOUR-BACKEND-URL.onrender.com/api
   ```
   (Use your actual Render backend URL)

6. Click "Deploy"
7. Wait 3-5 minutes
8. Copy your frontend URL (e.g., `https://campaign-poster-saas.vercel.app`)

**TEST IT:** Visit your Vercel URL

---

### Step 7: Update CORS (2 minutes)

1. Go back to Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Update `CORS_ORIGIN`:
   ```
   CORS_ORIGIN = https://YOUR-FRONTEND-URL.vercel.app
   ```
   (Use your actual Vercel URL)

5. Click "Save Changes"
6. Service will redeploy automatically

---

### Step 8: Setup Admin Access (1 minute)

1. Visit your Vercel URL: `https://YOUR-APP.vercel.app`
2. Press F12 to open browser console
3. Run this command:
   ```javascript
   localStorage.setItem('isAdmin', 'true');
   location.reload();
   ```
4. You should now see "Create Campaign" button!

---

### Step 9: Test Everything (5 minutes)

✅ **Test 1:** Backend Health
- Visit: `https://your-backend.onrender.com/api/health`
- Should return: `{"status":"OK",...}`

✅ **Test 2:** Frontend Loads
- Visit: `https://your-app.vercel.app`
- Should see homepage

✅ **Test 3:** Create Campaign
- Go to `/admin/create-campaign`
- Fill in title, dates
- Upload frame image
- Save campaign

✅ **Test 4:** Images Work
- Check if uploaded images appear
- Right-click image → should be from `res.cloudinary.com`

✅ **Test 5:** Public View
- Visit homepage
- See your campaign
- Click on it

✅ **Test 6:** Create Poster
- Upload photo
- Adjust position
- Download poster

---

## 🎉 YOU'RE LIVE!

Your Campaign Poster SaaS is now hosted completely FREE!

### Your URLs:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **Database**: MongoDB Atlas (check dashboard)
- **Images**: Cloudinary CDN (check dashboard)

---

## 📊 Monitor Your Usage

### Weekly Checks:
- MongoDB: https://cloud.mongodb.com (Storage < 512 MB)
- Cloudinary: https://cloudinary.com/console (Storage < 25 GB)
- Render: https://dashboard.render.com (Service running)
- Vercel: https://vercel.com/dashboard (Analytics)

### Monthly Tasks:
- Delete expired campaigns
- Remove old posters
- Check storage usage
- Review error logs

---

## ❓ Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify MongoDB connection string
- Check environment variables are set

### Images not uploading
- Verify Cloudinary credentials in Render
- Check Cloudinary dashboard for errors
- Make sure images are under 5MB

### Can't see admin features
- Run in browser console: `localStorage.setItem('isAdmin', 'true'); location.reload();`

### CORS errors
- Update CORS_ORIGIN in Render to match exact Vercel URL
- Include `https://` prefix
- No trailing slash

### Slow first request
- Normal! Render free tier sleeps after 15 min idle
- First request takes 30 seconds to wake up
- Subsequent requests are fast

---

## 💰 Cost: $0/Month Forever!

You're now running on:
- ✅ Vercel Free Tier
- ✅ Render Free Tier  
- ✅ MongoDB Atlas Free Tier
- ✅ Cloudinary Free Tier

**Total Cost: $0/month**

**Capacity:**
- 1-5 active campaigns
- Up to 1000 user posters
- 10,000+ monthly visitors
- LIFETIME usage!

---

## 📞 Need Help?

Check these files for more details:
- `DEPLOYMENT_GUIDE.md` - Complete guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `FREE_HOSTING_SUMMARY.md` - Overview of your stack

**Good luck with your campaigns!** 🚀🎉
