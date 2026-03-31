# Canvas Preview Debugging Guide

## 🔍 How to Debug the Preview Issue

### Step 1: Open Browser DevTools (F12)

Press **F12** or right-click → Inspect → Console tab

### Step 2: Navigate to Campaign Page

Go to any campaign page, e.g., http://localhost:3000/campaigns/[ID]

### Step 3: Watch Console Output

You should see detailed logs like this:

```
=== CANVAS USE EFFECT TRIGGERED ===
Campaign: YES
Canvas ref: EXISTS
Photo preview: NULL
Loading frame from URL: http://localhost:5000/uploads/frame-123.png
Full URL breakdown: {
  baseUrl: "http://localhost:5000",
  frameImageUrl: "/uploads/frame-123.png",
  combined: "http://localhost:5000/uploads/frame-123.png"
}
✅ Frame loaded successfully! {width: 800, height: 600}
No photo uploaded yet, showing frame only...
Frame displayed, waiting for photo upload...
```

---

## ✅ Success Indicators

### Good Signs:
- ✅ `Campaign: YES` - Campaign data loaded
- ✅ `Canvas ref: EXISTS` - Canvas element ready
- ✅ `Loading frame from URL: http://...` - Trying to load image
- ✅ `✅ Frame loaded successfully!` - Image loaded correctly
- ✅ `Frame displayed...` - Canvas is drawn

### Bad Signs (Need Fixing):
- ❌ `Campaign: NO` - Campaign not loaded → Check URL/route
- ❌ `Canvas ref: NULL` - Canvas not rendered → Check JSX
- ❌ `❌ Failed to load frame image` → Backend issue
- ❌ No console logs at all → useEffect not triggering

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to load frame image from URL"

**Console shows:**
```
❌ Failed to load frame image from: http://localhost:5000/uploads/frame-123.png
Error details: [object Event]
Try opening this URL directly in browser: http://localhost:5000/uploads/frame-123.png
```

**Solution:**
1. Copy the URL and open it directly in browser
2. If 404 error → Backend server not running
3. If image doesn't exist → Check uploads folder
4. Verify backend is serving static files:
   ```javascript
   // In server/index.js
   app.use('/uploads', express.static('uploads'));
   ```

**Quick Test:**
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Should return: {"status":"OK","message":"Server is running"}
```

---

### Issue 2: "Campaign: NO"

**Console shows:**
```
=== CANVAS USE EFFECT TRIGGERED ===
Campaign: NO
```

**Solution:**
1. Campaign data not loading
2. Check API endpoint: http://localhost:5000/api/campaigns/[ID]
3. Verify MongoDB has campaigns
4. Check network tab for failed API calls

---

### Issue 3: "Canvas ref: NULL"

**Console shows:**
```
=== CANVAS USE EFFECT TRIGGERED ===
Canvas ref: NULL
Exiting: No campaign or canvas
```

**Solution:**
1. Canvas element not in DOM
2. Check if JSX has `<canvas ref={canvasRef} />`
3. Component might be unmounted
4. Refresh page

---

### Issue 4: Image Loads But Canvas Blank

**Console shows:**
```
✅ Frame loaded successfully! {width: 800, height: 600}
Drawing with photo...
✅ Photo loaded, starting to draw...
 Drew white background
 Drew photo at {x: 0, y: 0, w: 100, h: 100}
 Drew frame overlay
 Drew text
🎨 Canvas drawing COMPLETE!
```

But canvas appears blank → **Check these:**

1. **Canvas size**: Might be tiny
   ```javascript
   console.log('Canvas dimensions:', {
     width: canvas.width,
     height: canvas.height
   });
   ```

2. **CSS hiding it**: Check computed styles
   ```javascript
   const computedStyle = window.getComputedStyle(canvas);
   console.log('Canvas display:', computedStyle.display);
   console.log('Canvas visibility:', computedStyle.visibility);
   ```

3. **Drawing outside bounds**: Try zooming out
   - Press Ctrl + - (minus) to zoom out
   - See if canvas exists but is off-screen

---

### Issue 5: CORS Error

**Console shows:**
```
Access to Image at 'http://localhost:5000/uploads/frame.png' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
Already handled with:
```typescript
frameImg.crossOrigin = 'anonymous';
```

If still seeing errors:
1. Check backend CORS config:
   ```javascript
   // server/index.js
   const cors = require('cors');
   app.use(cors());
   ```

2. Add explicit CORS headers:
   ```javascript
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', '*');
     next();
   });
   ```

---

## 🧪 Testing Checklist

Open console and verify each step:

### When Page Loads:
- [ ] `=== CANVAS USE EFFECT TRIGGERED ===`
- [ ] `Campaign: YES`
- [ ] `Canvas ref: EXISTS`
- [ ] `Loading frame from URL: ...`

### After Frame Loads:
- [ ] `✅ Frame loaded successfully!`
- [ ] `{width: ..., height: ...}`
- [ ] `Frame displayed, waiting for photo upload...`

### After Upload Photo:
- [ ] `Photo preview: EXISTS`
- [ ] `Drawing with photo...`
- [ ] `✅ Photo loaded, starting to draw...`
- [ ] ` Drew white background`
- [ ] ` Drew photo at {...}`
- [ ] ` Drew frame overlay`
- [ ] ` Drew text`
- [ ] `🎨 Canvas drawing COMPLETE!`

---

## 🎯 Visual Indicators on Page

### Yellow Box (Loading):
```
⏳ Loading canvas... Please wait.
```
Means: Canvas is initializing, wait a moment

### Blue Box (Ready, No Photo):
```
ℹ️ Frame loaded! Upload your photo to see the merged result.
```
Means: Everything working! Upload a photo to test

### Green Box (Ready, With Photo):
```
✅ Preview ready! Drag to adjust position.
```
Means: Full preview working! You can drag the photo

---

## 💡 Quick Fixes

### If Nothing Shows in Console:

1. **Hard refresh**: Ctrl + Shift + R
2. **Clear cache**: Ctrl + Shift + Delete
3. **Try different browser**: Chrome recommended
4. **Check for JavaScript errors**: Red errors in console

### If Backend Not Responding:

```bash
# Restart backend
cd server
npm run dev

# Should see:
# Connected to MongoDB
# Server running on port 5000
```

### If Frontend Not Updating:

```bash
# Restart frontend
cd client
npm run dev

# Or just press 'rs' in terminal to restart
```

---

## 📊 Expected Console Output (Complete Flow)

### Page Load:
```
=== CANVAS USE EFFECT TRIGGERED ===
Campaign: YES
Canvas ref: EXISTS
Photo preview: NULL
Loading frame from URL: http://localhost:5000/uploads/frame-1774935048431-449241434.png
Full URL breakdown: {
  baseUrl: "http://localhost:5000",
  frameImageUrl: "/uploads/frame-1774935048431-449241434.png",
  combined: "http://localhost:5000/uploads/frame-1774935048431-449241434.png"
}
✅ Frame loaded successfully! {width: 800, height: 600}
No photo uploaded yet, showing frame only...
Frame displayed, waiting for photo upload...
```

### Upload Photo:
```
=== CANVAS USE EFFECT TRIGGERED ===
Campaign: YES
Canvas ref: EXISTS
Photo preview: EXISTS
Loading frame from URL: http://localhost:5000/uploads/frame-1774935048431-449241434.png
✅ Frame loaded successfully! {width: 800, height: 600}
Drawing with photo...
✅ Photo loaded, starting to draw...
 Drew white background
 Drew photo at {x: 0, y: 0, w: 800, h: 600}
 Drew frame overlay
 Drew text
🎨 Canvas drawing COMPLETE!
```

---

## 🚨 Still Not Working?

### Last Resort Debug Steps:

1. **Add more logging**:
   ```typescript
   // At top of component
   console.log('Component rendering...', {
     campaignId: params.id,
     hasCampaign: !!campaign,
     hasPhoto: !!photoPreview
   });
   ```

2. **Test image directly**:
   ```html
   <!-- In browser address bar -->
   http://localhost:5000/uploads/YOUR_FRAME_FILENAME.png
   ```

3. **Check MongoDB data**:
   ```bash
   mongosh
   use campaign-poster-saas
   db.campaigns.find()
   ```

4. **Verify environment variables**:
   ```bash
   # Check client/.env.local exists
   cat client/.env.local
   
   # Should show:
   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

---

## ✅ Success Criteria

Preview is fully working when you see:

1. **Console logs** showing complete flow
2. **Yellow box** → **Blue box** → **Green box** progression
3. **Visible canvas** with frame image
4. **Upload photo** → Shows merged immediately
5. **Can drag photo** to reposition
6. **Download works** → Gets actual PNG file

---

**If you see ALL the console logs but still no preview**, please share:
1. Screenshot of console output
2. Screenshot of what you see on page
3. Network tab showing image requests
4. Any red errors in console

This will help identify the exact issue! 🎯
