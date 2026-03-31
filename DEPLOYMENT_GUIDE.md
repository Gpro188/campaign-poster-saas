# 🚀 Free Hosting Deployment Guide

## Campaign Poster SaaS - Complete Deployment Instructions

### Overview
This guide will help you deploy your Campaign Poster SaaS to **completely free hosting** with the capacity for:
- ✅ 50-100 active campaigns
- ✅ 500-1,000 user posters  
- ✅ 5-10 GB total images
- ✅ 10,000+ monthly visitors
- 💰 **$0/month cost**

---

## 📋 Prerequisites

1. **GitHub Account** (free)
2. **MongoDB Atlas Account** (free)
3. **Vercel Account** (free)
4. **Render.com Account** (free)
5. **Cloudinary Account** (free 25GB)

---

## Step 1: Prepare MongoDB Atlas Database

### 1.1 Create MongoDB Atlas Cluster
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Click "Build a Database" → Choose **FREE** tier (M0)
4. Select cloud provider and region (choose closest to your users)
5. Click "Create Cluster"

### 1.2 Configure Database Access
1. Go to **Database Access** in left sidebar
2. Click **Add New Database User**
3. Create username/password (save these!)
4. Set user privileges to **Read and write to any database**

### 1.3 Configure Network Access
1. Go to **Network Access** in left sidebar
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (for development)
   - For production, add specific IPs from Render.com
4. Click **Confirm**

### 1.4 Get Connection String
1. Go to **Database** → Click **Connect**
2. Choose **Connect your application**
3. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your credentials
5. Replace `/?retryWrites` with `/campaign-poster-saas?retryWrites` (add database name)

---

## Step 2: Setup Cloudinary for Image Storage

### 2.1 Create Cloudinary Account
1. Go to https://cloudinary.com
2. Sign up for free account
3. Go to **Dashboard**

### 2.2 Get API Credentials
From dashboard, copy:
- **Cloud Name**
- **API Key**
- **API Secret**

### 2.3 Install Cloudinary in Backend
```bash
cd server
npm install cloudinary multer-storage-cloudinary
```

### 2.4 Update Backend Configuration

Create `server/config/cloudinary.js`:
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'campaign-posters',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

module.exports = { cloudinary, upload };
```

---

## Step 3: Update Backend Code

### 3.1 Update Environment Variables

Create `server/.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campaign-poster-saas?retryWrites=true&w=majority
NODE_ENV=production
CORS_ORIGIN=https://your-app.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3.2 Update Campaign Controller

Update `server/controllers/campaignController.js` to use Cloudinary URLs instead of local paths.

Replace:
```javascript
frameImageUrl: `/uploads/${req.file.filename}`,
```

With:
```javascript
frameImageUrl: req.file.path, // Cloudinary URL
```

### 3.3 Update Poster Controller

Do the same for `server/controllers/posterController.js`.

---

## Step 4: Deploy Backend to Render.com

### 4.1 Prepare Repository

Make sure your code is on GitHub:
```bash
git init
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 4.2 Deploy to Render

1. Go to https://render.com
2. Sign up/login
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name**: campaign-poster-api
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free

6. Add Environment Variables:
   - Click **Environment** tab
   - Add all variables from `.env.example`
   - Use your actual MongoDB URI and Cloudinary credentials

7. Click **Create Web Service**

8. Wait for deployment (5-10 minutes)
9. Copy your backend URL (e.g., `https://campaign-poster-api.onrender.com`)

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Update Frontend Configuration

Create `client/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
```

### 5.2 Deploy to Vercel

1. Install Vercel CLI (optional):
   ```bash
   npm install -g vercel
   ```

2. **Option A: Using Vercel Dashboard** (Recommended)
   - Go to https://vercel.com
   - Import your GitHub repository
   - Root Directory: `client`
   - Framework Preset: Next.js
   - Add Environment Variable:
     - `NEXT_PUBLIC_API_URL`: Your Render backend URL
   
3. **Option B: Using CLI**
   ```bash
   cd client
   vercel
   # Follow prompts
   ```

4. Click **Deploy**

5. Vercel will give you a URL like:
   ```
   https://campaign-poster-saas.vercel.app
   ```

---

## Step 6: Update CORS Settings

Update `server/index.js`:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
```

Set `CORS_ORIGIN` in Render environment variables to your Vercel URL.

---

## Step 7: Test Everything

### 7.1 Test Backend
Visit: `https://your-backend-url.onrender.com/api/health`

Should return:
```json
{ "status": "OK", "message": "Server is running" }
```

### 7.2 Test Frontend
Visit: `https://your-app.vercel.app`

### 7.3 Test Full Flow
1. ✅ Login as admin (visit `/dashboard`)
2. ✅ Create a test campaign
3. ✅ Upload frame image (should go to Cloudinary)
4. ✅ Visit homepage - see campaign
5. ✅ Upload photo and create poster
6. ✅ Download poster

---

## Step 8: Admin Setup

### 8.1 Set Admin Flag
Since we're using simple localStorage auth:

1. Visit your site: `https://your-app.vercel.app`
2. Open browser console (F12)
3. Run:
   ```javascript
   localStorage.setItem('isAdmin', 'true');
   location.reload();
   ```
4. You should now see "Create Campaign" button

---

## Step 9: Campaign Management

### 9.1 Delete Old Campaigns

To stay within free limits:

1. Go to `/dashboard`
2. Review campaigns list
3. Delete expired/old campaigns:
   - Click trash icon 🗑️
   - Confirm deletion

### 9.2 Best Practices

**Before creating new campaign:**
- ✅ Check if you have old expired campaigns
- ✅ Delete campaigns older than 30 days
- ✅ Keep max 2-3 active campaigns at once

**Monitor usage:**
- MongoDB: Check storage in Atlas dashboard
- Cloudinary: Check usage in Cloudinary dashboard
- Render: Monitor bandwidth in Render dashboard

---

## 🔧 Troubleshooting

### Issue: Images not uploading
**Solution:** Check Cloudinary credentials in Render environment variables

### Issue: Backend slow to respond
**Solution:** Render free tier sleeps after 15 min. First request takes 30 sec. Subsequent requests are fast.

### Issue: Can't see "Create Campaign" button
**Solution:** Run `localStorage.setItem('isAdmin', 'true');` in browser console

### Issue: CORS errors
**Solution:** Update `CORS_ORIGIN` in Render to match your Vercel URL exactly

---

## 📊 Monitoring Your Usage

### Daily Checks
- MongoDB Atlas: Storage used (< 512 MB)
- Cloudinary: Storage & bandwidth (< 25 GB each)
- Render: Uptime and response times

### Weekly Tasks
- Delete expired campaigns
- Review user posters
- Check error logs

### Monthly Review
- Total campaigns created
- Total user posters
- Bandwidth usage
- Consider upgrading if hitting limits

---

## 💰 Cost Breakdown

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|------------|------|
| MongoDB Atlas | 512 MB | ~10 MB | $0 |
| Render.com | 750 hrs/month | 1 service | $0 |
| Vercel | Unlimited | 1 site | $0 |
| Cloudinary | 25 GB | 5-10 GB | $0 |
| **TOTAL** | | | **$0/month** |

---

## 🎉 You're Live!

Your Campaign Poster SaaS is now hosted completely FREE with capacity for:
- 50-100 campaigns
- 500-1,000 user posters
- 10,000+ monthly visitors

**Next Steps:**
1. Share your app URL with users
2. Create your first campaign
3. Monitor usage monthly
4. Delete old campaigns regularly

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Review Render logs for backend errors
3. Verify all environment variables are set correctly
4. Test each component individually

**Good luck with your campaign!** 🚀
