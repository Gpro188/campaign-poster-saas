# Campaign Poster SaaS

A full-stack web application that allows campaign owners to create frames/templates, and supporters to upload their photos to generate personalized campaign posters. Similar to SocialWaves.

## Features

### For Campaign Owners (Admins)
- **Create Campaigns**: Upload PNG frames with transparent areas
- **Position Text Elements**: Drag and drop to position name, designation, and location text
- **Customize Text Styles**: Adjust font size, color, and boldness
- **Dashboard**: View campaign statistics and track poster generation counts
- **Manage Campaigns**: Edit or delete existing campaigns

### For Supporters
- **Upload Photos**: Easy photo upload with drag-and-drop interface
- **Adjust Photos**: Scale and reposition photos within the frame
- **Personal Information**: Add name, designation, and location
- **Real-time Preview**: See the poster before downloading
- **Download High-Res**: Export high-quality PNG images
- **Share on WhatsApp**: One-click sharing to social media

## Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router) with React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Image Processing**: HTML5 Canvas API
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **File Upload**: Multer
- **CORS**: Enabled for cross-origin requests

## Project Structure

```
Campaign Poster SaaS/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   │   ├── admin/         # Admin pages
│   │   ├── campaigns/     # Campaign pages
│   │   └── dashboard/     # Dashboard page
│   ├── src/
│   │   ├── lib/           # Utilities (API client)
│   │   └── types/         # TypeScript types
│   └── .env.local         # Environment variables
├── server/                # Express backend
│   ├── controllers/       # Route controllers
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── uploads/           # Uploaded files storage
│   ├── index.js           # Server entry point
│   └── .env               # Environment variables
└── package.json           # Root package.json
```

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)

## Installation & Setup

### 1. Clone the Repository

```bash
cd "Campaign Poster SaaS"
```

### 2. Install Dependencies

```bash
npm run install-all
```

Or install manually:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

#### Backend (.env in server/)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campaign-poster-saas
NODE_ENV=development
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campaign-poster-saas
```

#### Frontend (.env.local in client/)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB

If using local MongoDB:
```bash
mongod
```

### 5. Run the Application

#### Development Mode (Recommended)

From the root directory:
```bash
npm run dev
```

This will start both the backend (port 5000) and frontend (port 3000).

Or run separately:
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

#### Production Mode

```bash
# Build and start backend
cd server
npm start

# Build and start frontend (in separate terminal)
cd client
npm run build
npm start
```

## Usage Guide

### Creating a Campaign (Admin)

1. Navigate to `http://localhost:3000`
2. Click "Create Campaign" or go to `/admin/create-campaign`
3. Fill in campaign details:
   - Title (required)
   - Description
4. Upload a frame image (PNG with transparency recommended)
5. Position text elements by dragging them on the canvas
6. Customize text styles (size, color) if needed
7. Click "Create Campaign"

### Generating a Poster (Supporter)

1. Visit the homepage `http://localhost:3000`
2. Browse active campaigns
3. Click on a campaign card
4. Upload your photo
5. Adjust the photo scale and position
6. Enter your name and other details
7. Preview the poster in real-time
8. Click "Download Poster" to save
9. Share on WhatsApp if desired

### Viewing Dashboard (Admin)

1. Navigate to `/dashboard`
2. View statistics:
   - Total campaigns
   - Active campaigns
   - Total posters created
3. Manage campaigns (view, edit, delete)
4. See recent posters generated

## API Endpoints

### Campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get campaign by ID
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/:id/stats` - Get campaign statistics

### Posters
- `POST /api/posters` - Create new poster
- `GET /api/posters` - Get all posters (admin)
- `GET /api/posters/campaign/:campaignId` - Get posters by campaign
- `GET /api/posters/:id` - Get poster by ID
- `POST /api/posters/:id/share` - Increment share count

## Image Processing Logic

The application uses HTML5 Canvas for client-side image processing:

1. **Layer 1**: User's uploaded photo (base layer)
2. **Layer 2**: Admin's frame overlay (PNG with transparent areas)
3. **Layer 3**: Dynamic text (name, designation, location)

The canvas renders at the original frame resolution for high-quality output.

## Mobile Responsiveness

The application is fully responsive with:
- Mobile-first design approach
- Touch-friendly controls for photo manipulation
- Responsive grid layouts
- Optimized canvas sizing for mobile devices
- Bottom navigation patterns

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- For Atlas, whitelist your IP address

### Port Already in Use
- Backend: Change `PORT` in `server/.env`
- Frontend: Run `npm run dev -- -p 3001` in client directory

### File Upload Not Working
- Check `uploads/` folder exists in server directory
- Verify file size limits in multer configuration
- Ensure proper CORS settings

### Canvas Not Rendering
- Check browser console for errors
- Ensure images are loaded before drawing
- Verify CORS headers for images

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

### Backend (Railway/Render)
1. Push code to GitHub
2. Create new service
3. Set environment variables
4. Connect to MongoDB Atlas
5. Deploy

### Database (MongoDB Atlas)
1. Create free cluster at mongodb.com/cloud/atlas
2. Get connection string
3. Update `MONGODB_URI` in backend `.env`

## Future Enhancements

- [ ] User authentication (JWT)
- [ ] Cloud storage integration (AWS S3)
- [ ] Email notifications
- [ ] Advanced text editing (fonts, shadows, outlines)
- [ ] Multiple frame support per campaign
- [ ] Analytics dashboard
- [ ] Social media auto-posting
- [ ] Template marketplace
- [ ] Payment integration for premium features

## License

ISC

## Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ using Next.js, Express, and MongoDB
