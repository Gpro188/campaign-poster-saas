# Quick Start Guide - Campaign Poster SaaS

## Getting Started in 5 Minutes

### Step 1: Install All Dependencies
```bash
npm run install-all
```

### Step 2: Start MongoDB
Make sure MongoDB is running on your machine:
- **Windows**: `mongod` (if installed as service, it should auto-start)
- **Mac**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`

**Alternative**: Use MongoDB Atlas (cloud):
1. Visit https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `MONGODB_URI` in `server/.env`

### Step 3: Run the Application
```bash
npm run dev
```

This starts both servers:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

### Step 4: Test the Application

1. **Visit Homepage**: http://localhost:3000
2. **Create First Campaign**:
   - Click "Create Campaign" button
   - Or navigate to: http://localhost:3000/admin/create-campaign
   
3. **Upload a Frame**:
   - Use any PNG image (transparent areas work best)
   - Example: Create a simple frame in Photoshop/Canva with transparent center
   
4. **Position Text**:
   - Drag the red-bordered text boxes on canvas
   - Adjust position for Name, Designation, Location
   
5. **Save Campaign**: Click "Create Campaign"

6. **Test as Supporter**:
   - Go back to homepage
   - Click on your campaign card
   - Upload a photo
   - Adjust scale and position
   - Enter your name
   - Download the poster!

## Default Configuration

### Backend Server
- Port: 5000
- Database: mongodb://localhost:27017/campaign-poster-saas
- Uploads folder: server/uploads/

### Frontend Server
- Port: 3000
- API URL: http://localhost:5000/api

## Common Issues & Solutions

### Issue: MongoDB Connection Error
**Solution 1**: Check if MongoDB is running
```bash
# Windows - Check Services
services.msc
# Look for "MongoDB" service

# Or start manually
mongod
```

**Solution 2**: Use MongoDB Atlas instead (recommended for beginners)

### Issue: Port 3000 Already in Use
**Solution**: Use different port
```bash
cd client
npm run dev -- -p 3001
```

### Issue: Backend Not Starting
**Solution**: Check if port 5000 is available
```bash
# Windows
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <PID> /F
```

### Issue: Images Not Uploading
**Solution**: Ensure uploads folder exists
```bash
# Navigate to server directory
cd server
# Create uploads folder if missing
mkdir uploads
```

### Issue: Canvas Not Showing Preview
**Solution**: 
1. Check browser console (F12)
2. Ensure image URLs are correct
3. Verify backend is serving static files

## Testing Checklist

✅ Backend starts successfully on port 5000
✅ Frontend starts successfully on port 3000
✅ MongoDB connection established
✅ Can upload frame image
✅ Can position text elements
✅ Can create campaign
✅ Campaign appears on homepage
✅ Can upload supporter photo
✅ Can adjust photo scale/position
✅ Can download generated poster
✅ WhatsApp share button works

## Next Steps After Setup

1. **Customize Branding**:
   - Edit colors in Tailwind config
   - Add your logo
   - Update meta tags

2. **Configure Production**:
   - Set up MongoDB Atlas
   - Deploy backend to Railway/Render
   - Deploy frontend to Vercel

3. **Add Features**:
   - User authentication
   - Email notifications
   - Cloud storage (AWS S3)
   - Advanced text editing

## Sample Test Data

Want to test quickly? Here's sample campaign data:

**Campaign Title**: "Vote for Change 2026"
**Description**: "Join the movement for a better future!"
**Frame**: Any PNG with transparent center (800x600 recommended)
**Text Positions**:
- Name: x=400, y=500, size=48, color=#FFFFFF
- Designation: x=400, y=550, size=32, color=#FFFF00
- Location: x=400, y=590, size=28, color=#FFFFFF

## Development Tips

- **Hot Reload**: Both servers auto-reload on file changes
- **Browser DevTools**: Use React DevTools for debugging
- **API Testing**: Use Postman or Thunder Client to test endpoints
- **Database GUI**: Use MongoDB Compass to view data

## Need Help?

1. Check the main README.md for detailed documentation
2. Review browser console for errors
3. Check server logs in terminal
4. Verify all environment variables are set correctly

---

Happy Coding! 🚀
