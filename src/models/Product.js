// filepath: models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  teamName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    default: ''
  },
  type: {
    type: String,
    required: true,
    default: ''
  },
  size: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  color: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{ 
    type: String 
  }],
  season: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient searches
productSchema.index({ teamName: 1, size: 1, category: 1 });
productSchema.index({ teamName: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);