const mongoose = require('mongoose');

const preOrderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  teamName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
});

const preOrderSchema = new mongoose.Schema({
  // preOrderCode: {
  //   type: String,
  //   required: true,
  //   unique: true
  // },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [preOrderItemSchema],
  totalEstimatedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Chờ hàng', 'Đã có hàng', 'Đã giao', 'Đã hủy'],
    default: 'Chờ hàng'
  },
  deposit: {
    type: Number,
    min: 0,
    default: 0
  },
  expectedDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  convertedToOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
}, {
  timestamps: true
});

// Generate pre-order code before saving
preOrderSchema.pre('save', async function(next) {
  if (!this.preOrderCode) {
    const count = await this.constructor.countDocuments();
    this.preOrderCode = `PRE${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

preOrderSchema.index({ preOrderCode: 1 });
preOrderSchema.index({ customer: 1 });
preOrderSchema.index({ status: 1 });
preOrderSchema.index({ orderDate: -1 });

module.exports = mongoose.model('PreOrder', preOrderSchema);