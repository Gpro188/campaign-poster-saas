const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// POST /api/campaigns - Create new campaign
router.post('/', 
  campaignController.upload.single('frame'), 
  campaignController.createCampaign
);

// GET /api/campaigns - Get all campaigns (public - only active within subscription)
router.get('/', campaignController.getAllCampaigns);

// GET /api/campaigns/admin/all - Get all campaigns for admin (includes expired)
router.get('/admin/all', campaignController.getAllAdminCampaigns);

// GET /api/campaigns/:id - Get campaign by ID
router.get('/:id', campaignController.getCampaignById);

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', 
  campaignController.upload.single('frame'), 
  campaignController.updateCampaign
);

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', campaignController.deleteCampaign);

// GET /api/campaigns/:id/stats - Get campaign stats
router.get('/:id/stats', campaignController.getCampaignStats);

module.exports = router;
