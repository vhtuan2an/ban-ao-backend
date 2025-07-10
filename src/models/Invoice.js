const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  // invoiceCode: {
  //   type: String,
  //   required: true,
  //   unique: true
  // },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Tiền mặt', 'Chuyển khoản', 'Thẻ', 'Khác'],
    default: 'Tiền mặt'
  },
  paymentNotes: {
    type: String,
    trim: true,
    default: ''
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Đã xuất', 'Đã thanh toán', 'Quá hạn', 'Đã hủy'],
    default: 'Đã xuất'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Generate invoice code before saving
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceCode) {
    const count = await this.constructor.countDocuments();
    this.invoiceCode = `INV${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

invoiceSchema.index({ invoiceCode: 1 });
invoiceSchema.index({ order: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ issueDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);