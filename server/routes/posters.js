const express = require('express');
const router = express.Router();
const posterController = require('../controllers/posterController');

// POST /api/posters - Create new poster
router.post('/', 
  posterController.upload.single('photo'), 
  posterController.createPoster
);

// GET /api/posters - Get all posters (admin)
router.get('/', posterController.getAllPosters);

// GET /api/posters/campaign/:campaignId - Get posters by campaign
router.get('/campaign/:campaignId', posterController.getPostersByCampaign);

// GET /api/posters/:id - Get poster by ID
router.get('/:id', posterController.getPosterById);

// POST /api/posters/:id/share - Increment share count
router.post('/:id/share', posterController.incrementShareCount);

module.exports = router;
