const Order = require('../models/OrderItem');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const ProductService = require('./ProductService');

class OrderService {
  // Get all orders with filtering
  async getAllOrders(filters) {
    // Simply get all orders without any filtering
    const orders = await Order.find({isDeleted: false})
      .populate('customer', 'name phone address')
      .populate('items.product', 'name teamName category size images')
      .sort({ orderDate: -1 });

    return {
      orders
    };
  }

  // Get order by ID
  async getOrderById(id) {
    const order = await Order.findById(id, { isDeleted: false })
      .populate('customer', 'name phone address')
      .populate('items.product', 'name teamName category size images');
      
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  // Create new order
  async createOrder(orderData) {
    const { customerId, items, paymentMethod, paymentStatus, notes, status } = orderData;

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Validate and process items
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const { productId, quantity, printName, printNumber, homeOrAway, adultOrKid } = item;
      
      // Check product availability
      await ProductService.checkProductAvailability(productId, quantity);
      
      const product = await Product.findById(productId);
      const subtotal = product.price * quantity;
      
      processedItems.push({
        product: productId,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        quantity: quantity,
        teamName: product.teamName,
        homeOrAway: homeOrAway || product.homeOrAway || 'Home',
        season: product.season,
        adultOrKid: adultOrKid || product.adultOrKid || 'Adult',
        size: product.size,
        printName: printName || '',
        printNumber: printNumber || '',
        supplier: product.supplier,
        price: product.price,
        subtotal: subtotal
      });
      
      totalAmount += subtotal;
    }

    // Create order
    const order = new Order({
      customer: customerId,
      items: processedItems,
      status,
      totalAmount,
      paymentMethod: paymentMethod || 'Tiền mặt',
      paymentStatus: paymentStatus || 'Chưa thanh toán',
      notes: notes || ''
    });

    await order.save();

    // Reduce stock for each item
    for (const item of items) {
      await ProductService.reduceStock(item.productId, item.quantity);
    }

    // Populate order details before returning
    const populatedOrder = await this.getOrderById(order._id);
    return populatedOrder;
  }

  // Update order
  async updateOrder(id, updateData) {
    const order = await Order.findById(id , { isDeleted: false });
    if (!order) {
      throw new Error('Order not found');
    }

    // Prevent updating completed or cancelled orders
    // if (order.status === 'Đã giao' || order.status === 'Đã hủy') {
    //   throw new Error('Cannot update completed or cancelled orders');
    // }

    // If updating items, handle stock changes
    if (updateData.items) {
      // Restore stock for original items
      for (const item of order.items) {
        await ProductService.restoreStock(item.product, item.quantity);
      }

      // Process new items
      let totalAmount = 0;
      const processedItems = [];

      for (const item of updateData.items) {
        const { productId, quantity } = item;
        
        // Check product availability
        await ProductService.checkProductAvailability(productId, quantity);
        
        const product = await Product.findById(productId);
        const subtotal = product.price * quantity;
        
        processedItems.push({
          product: productId,
          teamName: product.teamName,
          category: product.category,
          size: product.size,
          quantity: quantity,
          price: product.price,
          subtotal: subtotal
        });
        
        totalAmount += subtotal;
      }

      updateData.items = processedItems;
      updateData.totalAmount = totalAmount;

      // Reduce stock for new items
      for (const item of updateData.items) {
        await ProductService.reduceStock(item.product, item.quantity);
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return await this.getOrderById(updatedOrder._id);
  }

  // Update order status
  async updateOrderStatus(id, status) {
    const order = await Order.findById(id, { isDeleted: false });
    if (!order) {
      throw new Error('Order not found');
    }

    // If cancelling order, restore stock
    if (status === 'Đã hủy' && order.status !== 'Đã hủy') {
      for (const item of order.items) {
        await ProductService.restoreStock(item.product, item.quantity);
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    return await this.getOrderById(updatedOrder._id);
  }

  // Update payment status
  async updatePaymentStatus(id, paymentStatus, paymentMethod) {
    const order = await Order.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    const updateData = { paymentStatus };
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return await this.getOrderById(updatedOrder._id);
  }

  // Delete order (soft delete by setting isDeleted = true)
  async deleteOrder(id) {
    const order = await Order.findOne({ _id: id, isDeleted: false });
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'Đã giao') {
      throw new Error('Cannot delete delivered orders');
    }

    // Restore stock if order is not already cancelled
    if (order.status !== 'Đã hủy') {
      for (const item of order.items) {
        await ProductService.restoreStock(item.product, item.quantity);
      }
    }

    // Soft delete by setting isDeleted = true and status to cancelled
    await Order.findByIdAndUpdate(id, { 
      isDeleted: true,
      status: 'Đã hủy'
    });

    return { message: 'Order deleted successfully' };
  }

  // Get order statistics
  async getOrderStatistics(filters = {}) {
    const { startDate, endDate } = filters;
    
    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.orderDate = {};
      if (startDate) matchFilter.orderDate.$gte = new Date(startDate);
      if (endDate) matchFilter.orderDate.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          ordersByStatus: {
            $push: {
              status: '$status',
              amount: '$totalAmount'
            }
          }
        }
      }
    ];

    const result = await Order.aggregate(pipeline);
    
    if (result.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        ordersByStatus: {}
      };
    }

    const stats = result[0];
    
    // Group orders by status
    const statusStats = {};
    stats.ordersByStatus.forEach(order => {
      if (!statusStats[order.status]) {
        statusStats[order.status] = { count: 0, revenue: 0 };
      }
      statusStats[order.status].count++;
      statusStats[order.status].revenue += order.amount;
    });

    return {
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      avgOrderValue: stats.avgOrderValue,
      ordersByStatus: statusStats
    };
  }

  // Get recent orders
  async getRecentOrders(limit = 10) {
    const orders = await Order.find()
      .populate('customer', 'name phone')
      .sort({ orderDate: -1 })
      .limit(limit);

    return orders;
  }

  // Search orders
  async searchOrders(query) {
    const customer = await Customer.findOne({ name: new RegExp(query, 'i') });
    const customerId = customer ? customer._id : null;
    const orders = await Order.find({
      $or: [
        { customer: customerId },
        { notes: new RegExp(query, 'i') }
      ]
    })
    .populate('customer', 'name phone address')
    .populate('items.product', 'name teamName')
    .sort({ orderDate: -1 });

    return orders;
  }
}

module.exports = new OrderService();