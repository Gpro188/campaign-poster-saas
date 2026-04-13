const Campaign = require('../models/Campaign');
const { upload } = require('../config/cloudinary');

// Create a new campaign
const createCampaign = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Frame image is required' });
    }

    const { title, description, textPositions, ownerId, startDate, endDate, cropShape } = req.body;
    
    // Parse dates or use defaults
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    
    // Validate end date is after start date
    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    
    const campaignData = {
      title,
      description,
      frameImageUrl: req.file.path, // Cloudinary URL
      ownerId: ownerId || 'admin',
      textPositions: textPositions ? JSON.parse(textPositions) : [],
      startDate: start,
      endDate: end,
      isSubscriptionActive: true
    };

    // Add cropShape if provided
    if (cropShape) {
      try {
        campaignData.cropShape = JSON.parse(cropShape);
      } catch (e) {
        console.error('Error parsing cropShape:', e);
      }
    }

    const campaign = new Campaign(campaignData);
    await campaign.save();

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Failed to create campaign', error: error.message });
  }
};

// Get all campaigns - PUBLIC endpoint (returns only active campaigns within subscription period)
const getAllCampaigns = async (req, res) => {
  try {
    const now = new Date();
    
    // Find campaigns that are:
    // 1. Status = active
    // 2. Subscription is active
    // 3. Current date is within start and end dates
    const campaigns = await Campaign.find({
      status: 'active',
      isSubscriptionActive: { $ne: false },
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ createdAt: -1 });
    
    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Failed to fetch campaigns', error: error.message });
  }
};

// Get campaign by ID
const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: 'Failed to fetch campaign', error: error.message });
  }
};

// Get all campaigns for ADMIN (includes expired and inactive)
const getAllAdminCampaigns = async (req, res) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    
    // Add computed field for active status
    const campaignsWithStatus = campaigns.map(c => {
      const isActive = c.status === 'active' && 
                      c.isSubscriptionActive !== false &&
                      now >= c.startDate && 
                      now <= c.endDate;
      return { ...c.toObject(), isCurrentlyActive: isActive };
    });
    
    res.json({ campaigns: campaignsWithStatus });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Failed to fetch campaigns', error: error.message });
  }
};

// Update campaign
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, textPositions, status, startDate, endDate, isSubscriptionActive, cropShape } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (isSubscriptionActive !== undefined) updateData.isSubscriptionActive = isSubscriptionActive;
    if (textPositions) updateData.textPositions = JSON.parse(textPositions);
    
    // Handle cropShape
    if (cropShape) {
      try {
        updateData.cropShape = JSON.parse(cropShape);
      } catch (e) {
        console.error('Error parsing cropShape in update:', e);
      }
    } else if (cropShape === 'null' || cropShape === '') {
      // Allow removing crop shape
      updateData.cropShape = null;
    }

    // Handle new frame image upload
    if (req.file) {
      updateData.frameImageUrl = req.file.path; // Cloudinary URL
    }

    const campaign = await Campaign.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({
      message: 'Campaign updated successfully',
      campaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Failed to update campaign', error: error.message });
  }
};

// Delete campaign
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByIdAndDelete(id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ message: 'Failed to delete campaign', error: error.message });
  }
};

// Get campaign stats
const getCampaignStats = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const Poster = require('../models/Poster');
    const totalPosters = await Poster.countDocuments({ campaignId: id });
    const recentPosters = await Poster.find({ campaignId: id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      campaign,
      totalPosters,
      recentPosters
    });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ message: 'Failed to fetch campaign stats', error: error.message });
  }
};

module.exports = {
  upload,
  createCampaign,
  getAllCampaigns,
  getAllAdminCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
};
