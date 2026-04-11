const mongoose = require('mongoose');

const textPositionSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
    enum: ['name', 'designation', 'location']
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  fontSize: {
    type: Number,
    default: 48
  },
  fontFamily: {
    type: String,
    default: 'Arial'
  },
  color: {
    type: String,
    default: '#FFFFFF'
  },
  isBold: {
    type: Boolean,
    default: true
  }
});

const cropShapeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['circle', 'rectangle', 'triangle'],
    default: 'rectangle'
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  rotation: {
    type: Number,
    default: 0
  }
});

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  frameImageUrl: {
    type: String,
    required: true
  },
  textPositions: [textPositionSchema],
  cropShape: {
    type: cropShapeSchema,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  ownerId: {
    type: String,
    required: true
  },
  posterCount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  isSubscriptionActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying of active campaigns
campaignSchema.index({ status: 1, startDate: 1, endDate: 1 });

// Virtual to check if campaign is currently active based on dates
campaignSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.isSubscriptionActive !== false &&
         now >= this.startDate && 
         now <= this.endDate;
});

module.exports = mongoose.model('Campaign', campaignSchema);
