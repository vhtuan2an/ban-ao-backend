const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    
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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Đã tạo', 'Đã thanh toán', 'Đã giao', 'Đã hủy'],
    default: 'Đã tạo'
  },
  paymentMethod: {
    type: String,
    enum: ['Tiền mặt', 'Chuyển khoản', 'Thẻ', 'Khác'],
    default: 'Tiền mặt'
  },
  paymentStatus: {
    type: String,
    enum: ['Chưa thanh toán', 'Đã thanh toán', 'Thanh toán một phần'],
    default: 'Chưa thanh toán'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

orderSchema.index({ customer: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);