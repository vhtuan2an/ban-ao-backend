const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  image: {
    type: String, // Lấy từ product.images[0] hoặc chỉ định cụ thể
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  teamName: {
    type: String,
    required: true // Lấy từ product.teamName
  },
  homeOrAway: {
    type: String,
    enum: ['Home', 'Away', 'Third'],
    default: 'Home' // Có thể lấy từ product hoặc chỉ định khi tạo order
  },
  season: {
    type: String,
    default: '' // Lấy từ product.season
  },
  adultOrKid: {
    type: String,
    enum: ['Adult', 'Kid'],
    default: 'Adult' // Có thể lấy từ product hoặc chỉ định khi tạo order
  },
  size: {
    type: String,
    required: true // Lấy từ product.size
  },
  printName: {
    type: String,
    trim: true,
    default: '' // Người dùng nhập khi đặt hàng
  },
  printNumber: {
    type: String,
    trim: true,
    default: '' // Người dùng nhập khi đặt hàng
  },
  supplier: {
    type: String,
    trim: true,
    default: '' // Có thể lấy từ product hoặc chỉ định
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