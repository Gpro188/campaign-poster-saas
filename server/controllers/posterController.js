const Poster = require('../models/Poster');
const Campaign = require('../models/Campaign');
const multer = require('multer');
const path = require('path');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create a new poster
const createPoster = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Photo is required' });
    }

    const { campaignId, supporterName, designation, location, generatedImageUrl } = req.body;

    // Verify campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const posterData = {
      campaignId,
      supporterName,
      designation,
      location,
      uploadedPhotoUrl: `/uploads/${req.file.filename}`,
      generatedImageUrl: generatedImageUrl || `/uploads/${req.file.filename}`
    };

    const poster = new Poster(posterData);
    await poster.save();

    // Increment campaign poster count
    campaign.posterCount += 1;
    await campaign.save();

    res.status(201).json({
      message: 'Poster created successfully',
      poster
    });
  } catch (error) {
    console.error('Error creating poster:', error);
    res.status(500).json({ message: 'Failed to create poster', error: error.message });
  }
};

// Get posters by campaign
const getPostersByCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const posters = await Poster.find({ campaignId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Poster.countDocuments({ campaignId });

    res.json({
      posters,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Error fetching posters:', error);
    res.status(500).json({ message: 'Failed to fetch posters', error: error.message });
  }
};

// Get poster by ID
const getPosterById = async (req, res) => {
  try {
    const { id } = req.params;
    const poster = await Poster.findById(id).populate('campaignId');

    if (!poster) {
      return res.status(404).json({ message: 'Poster not found' });
    }

    res.json({ poster });
  } catch (error) {
    console.error('Error fetching poster:', error);
    res.status(500).json({ message: 'Failed to fetch poster', error: error.message });
  }
};

// Get all posters (for admin dashboard)
const getAllPosters = async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const posters = await Poster.find()
      .populate('campaignId', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Poster.countDocuments();

    res.json({
      posters,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Error fetching posters:', error);
    res.status(500).json({ message: 'Failed to fetch posters', error: error.message });
  }
};

// Update share count
const incrementShareCount = async (req, res) => {
  try {
    const { id } = req.params;
    const poster = await Poster.findByIdAndUpdate(
      id,
      { $inc: { shareCount: 1 } },
      { new: true }
    );

    if (!poster) {
      return res.status(404).json({ message: 'Poster not found' });
    }

    res.json({ poster });
  } catch (error) {
    console.error('Error incrementing share count:', error);
    res.status(500).json({ message: 'Failed to increment share count', error: error.message });
  }
};

module.exports = {
  upload,
  createPoster,
  getPostersByCampaign,
  getPosterById,
  getAllPosters,
  incrementShareCount,
};
