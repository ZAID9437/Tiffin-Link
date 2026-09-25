const mongoose = require('mongoose');

const safetyGuidelineSchema = new mongoose.Schema({
  guidelineId: {
    type: String,
    required: true,
    unique: true
  },
  version: {
    type: String,
    default: 'SAF-902-v4.2'
  },
  title: {
    type: String,
    default: 'Safety Guidelines & Compliance'
  },
  subtitle: {
    type: String,
    default: 'Follow these guidelines to keep yourself, kitchen partners, and customers safe during deliveries.'
  },
  effectiveDate: {
    type: String,
    default: '18 Sep 2026'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SafetyGuideline', safetyGuidelineSchema);
