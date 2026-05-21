const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const authMiddleware = require('../middleware/auth');

// POST /api/campaigns - Create new campaign (admin only)
router.post('/', 
  authMiddleware,
  campaignController.upload.single('frame'), 
  campaignController.createCampaign
);

// GET /api/campaigns - Get all campaigns (public - only active within subscription)
router.get('/', campaignController.getAllCampaigns);

// GET /api/campaigns/admin/all - Get all campaigns for admin (includes expired, admin only)
router.get('/admin/all', authMiddleware, campaignController.getAllAdminCampaigns);

// GET /api/campaigns/:id - Get campaign by ID (public)
router.get('/:id', campaignController.getCampaignById);

// PUT /api/campaigns/:id - Update campaign (admin only)
router.put('/:id', 
  authMiddleware,
  campaignController.upload.single('frame'), 
  campaignController.updateCampaign
);

// DELETE /api/campaigns/:id - Delete campaign (admin only)
router.delete('/:id', authMiddleware, campaignController.deleteCampaign);

// GET /api/campaigns/:id/stats - Get campaign stats (admin only)
router.get('/:id/stats', authMiddleware, campaignController.getCampaignStats);

module.exports = router;
