const mongoose = require('mongoose');

const posterSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  supporterName: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  uploadedPhotoUrl: {
    type: String,
    required: true
  },
  generatedImageUrl: {
    type: String,
    required: true
  },
  shareCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for fast query of posters by campaign
posterSchema.index({ campaignId: 1 });

module.exports = mongoose.model('Poster', posterSchema);
