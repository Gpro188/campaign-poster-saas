# Running the Application - Important Notes

## Current Status

✅ **Frontend**: Fully implemented and ready  
✅ **Backend**: Fully implemented and ready  
⚠️ **MongoDB**: Requires MongoDB installation or Atlas account

## The Backend Issue

The backend server requires MongoDB to be running. You have two options:

### Option 1: Install MongoDB Locally (Recommended for Development)

#### Windows:
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will run as a Windows service automatically
4. No additional configuration needed!

#### Verify MongoDB is running:
```bash
# Open PowerShell and run:
mongosh
# If it connects, you're good to go!
```

### Option 2: Use MongoDB Atlas (Cloud - Free Tier)

1. Visit https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free cluster (M0)
4. Get your connection string
5. Update `server/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campaign-poster-saas
```

## Starting the Application

### Once MongoDB is Running:

**Option A: Run Both Servers Together**
```bash
npm run dev
```

**Option B: Run Servers Separately (in different terminals)**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

## Expected Output

### Backend (should see):
```
[nodemon] starting `node index.js`
Connected to MongoDB
Server running on port 5000
```

### Frontend (should see):
```
ready - started server on 0.0.0.0:3000
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health
- **Admin Dashboard**: http://localhost:3000/dashboard
- **Create Campaign**: http://localhost:3000/admin/create-campaign

## Troubleshooting

### Error: "MongoDB connection error"
**Solution**: MongoDB is not running
- Check if MongoDB service is running (Windows Services)
- Or start manually: `mongod`
- Or use MongoDB Atlas

### Error: "Port already in use"
**Solution**: Another process is using the port
```bash
# Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### Frontend won't load campaigns
**Solution**: Backend is not running
- Make sure backend server is started first
- Check backend terminal for errors
- Verify MongoDB connection

## Quick Test Checklist

1. ✅ MongoDB is running
2. ✅ Backend starts without errors
3. ✅ Frontend starts without errors
4. ✅ Visit http://localhost:3000
5. ✅ See homepage with campaign grid
6. ✅ Click "Create Campaign"
7. ✅ Upload a frame image
8. ✅ Position text elements
9. ✅ Save campaign
10. ✅ Test poster generation

## Sample Frame Images

You can create frame images using:
- **Canva**: Create design with transparent background
- **Photoshop/GIMP**: Export as PNG with transparency
- **PowerPoint**: Insert shapes, export as PNG

Recommended size: 800x600 or 1024x768 pixels

## Next Steps After Testing

1. **Production Setup**:
   - Deploy backend to Railway/Render
   - Deploy frontend to Vercel
   - Use MongoDB Atlas for production

2. **Customization**:
   - Update branding/colors in Tailwind config
   - Add authentication
   - Integrate cloud storage (AWS S3)

3. **Features**:
   - Email notifications
   - Advanced text editing
   - Multiple templates per campaign

---

**Need Help?**
- Check README.md for full documentation
- Check QUICKSTART.md for setup guide
- Review browser console for frontend errors
- Check server terminal for backend errors
