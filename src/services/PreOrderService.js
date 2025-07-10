const PreOrder = require('../models/PreOrderItem');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/OrderItem');

class PreOrderService {
  // Get all pre-orders with filtering
  async getAllPreOrders(filters) {
    const { customerName, status, startDate, endDate, preOrderCode } = filters;
    
    const filter = {};
    
    // Filter by status
    if (status) {
      filter.status = status;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    // Build aggregation pipeline for customer name filtering
    let pipeline = [
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: '$customerInfo'
      }
    ];

    // Add customer name filter if provided
    if (customerName) {
      pipeline.push({
        $match: {
          'customerInfo.name': new RegExp(customerName, 'i')
        }
      });
    }

    // Add other filters
    if (Object.keys(filter).length > 0) {
      pipeline.push({
        $match: filter
      });
    }

    // Add sorting
    pipeline.push({
      $sort: { orderDate: -1 }
    });

    const preOrders = await PreOrder.aggregate(pipeline);

    return {
      preOrders
    };
  }

  // Get pre-order by ID
  async getPreOrderById(id) {
    const preOrder = await PreOrder.findById(id)
      .populate('customer', 'name phone address')
      .populate('convertedToOrder');
      
    if (!preOrder) {
      throw new Error('Pre-order not found');
    }
    return preOrder;
  }

//   // Get pre-order by code
//   async getPreOrderByCode(preOrderCode) {
//     const preOrder = await PreOrder.findOne({ preOrderCode })
//       .populate('customer', 'name phone address')
//       .populate('convertedToOrder');
      
//     if (!preOrder) {
//       throw new Error('Pre-order not found');
//     }
//     return preOrder;
//   }

  // Create new pre-order
  async createPreOrder(preOrderData) {
    const { customerId, items, expectedDate, deposit, notes } = preOrderData;

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Process items and calculate total estimated amount
    let totalEstimatedAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const { name, teamName, category, size, quantity, estimatedPrice, notes } = item;
      
      const subtotal = estimatedPrice * quantity;
      
      processedItems.push({
        name,
        teamName,
        category,
        size,
        quantity,
        estimatedPrice,
        notes: notes || ''
      });
      
      totalEstimatedAmount += subtotal;
    }

    // Create pre-order
    const preOrder = new PreOrder({
      customer: customerId,
      items: processedItems,
      totalEstimatedAmount,
      expectedDate: expectedDate ? new Date(expectedDate) : null,
      deposit: deposit || 0,
      notes: notes || ''
    });

    await preOrder.save();

    // Populate pre-order details before returning
    const populatedPreOrder = await this.getPreOrderById(preOrder._id);
    return populatedPreOrder;
  }

  // Update pre-order
  async updatePreOrder(id, updateData) {
    const preOrder = await PreOrder.findById(id);
    if (!preOrder) {
      throw new Error('Pre-order not found');
    }

    // Prevent updating delivered or cancelled pre-orders
    if (preOrder.status === 'Đã giao' || preOrder.status === 'Đã hủy') {
      throw new Error('Cannot update delivered or cancelled pre-orders');
    }

    // If updating items, recalculate total estimated amount
    if (updateData.items) {
      let totalEstimatedAmount = 0;
      const processedItems = [];

      for (const item of updateData.items) {
        const { name, teamName, category, size, quantity, estimatedPrice, notes } = item;
        
        const subtotal = estimatedPrice * quantity;
        
        processedItems.push({
          name,
          teamName,
          category,
          size,
          quantity,
          estimatedPrice,
          notes: notes || ''
        });
        
        totalEstimatedAmount += subtotal;
      }

      updateData.items = processedItems;
      updateData.totalEstimatedAmount = totalEstimatedAmount;
    }

    const updatedPreOrder = await PreOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return await this.getPreOrderById(updatedPreOrder._id);
  }

  // Update pre-order status
  async updatePreOrderStatus(id, status) {
    const preOrder = await PreOrder.findById(id);
    if (!preOrder) {
      throw new Error('Pre-order not found');
    }

    const updatedPreOrder = await PreOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    return await this.getPreOrderById(updatedPreOrder._id);
  }

  // Convert pre-order to regular order
  async convertToOrder(id, conversionData) {
    const preOrder = await PreOrder.findById(id).populate('customer');
    if (!preOrder) {
      throw new Error('Pre-order not found');
    }

    if (preOrder.status !== 'Đã có hàng') {
      throw new Error('Pre-order must have status "Đã có hàng" to convert to order');
    }

    if (preOrder.convertedToOrder) {
      throw new Error('Pre-order has already been converted to order');
    }

    const { items, paymentMethod, paymentStatus, notes } = conversionData;

    // Validate that products exist for conversion
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { productId, quantity } = item;
      
      // Check if product exists and has enough stock
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error(`Product not found for item: ${productId}`);
      }

      if (product.quantity < quantity) {
        throw new Error(`Not enough stock for product: ${product.teamName} ${product.size}. Available: ${product.quantity}, Required: ${quantity}`);
      }

      const subtotal = product.price * quantity;
      
      orderItems.push({
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

    // Create the order
    const order = new Order({
      customer: preOrder.customer._id,
      items: orderItems,
      totalAmount,
      paymentMethod: paymentMethod || 'Tiền mặt',
      paymentStatus: paymentStatus || 'Chưa thanh toán',
      notes: notes || `Converted from pre-order ${preOrder.preOrderCode}`
    });

    await order.save();

    // Reduce stock for each item
    for (const item of items) {
      const product = await Product.findById(item.productId);
      product.quantity -= item.quantity;
      await product.save();
    }

    // Update pre-order status and link to order
    preOrder.status = 'Đã giao';
    preOrder.convertedToOrder = order._id;
    await preOrder.save();

    return {
      preOrder: await this.getPreOrderById(preOrder._id),
      order: await Order.findById(order._id)
        .populate('customer', 'name phone address')
        .populate('items.product', 'name teamName category size images')
    };
  }

  // Delete pre-order (soft delete by cancelling)
  async deletePreOrder(id) {
    const preOrder = await PreOrder.findById(id);
    if (!preOrder) {
      throw new Error('Pre-order not found');
    }

    if (preOrder.status === 'Đã giao') {
      throw new Error('Cannot delete delivered pre-orders');
    }

    if (preOrder.convertedToOrder) {
      throw new Error('Cannot delete pre-orders that have been converted to orders');
    }

    // Update status to cancelled
    await PreOrder.findByIdAndUpdate(id, { status: 'Đã hủy' });

    return { message: 'Pre-order cancelled successfully' };
  }

  // Get pre-order statistics
  async getPreOrderStatistics(filters = {}) {
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
          totalPreOrders: { $sum: 1 },
          totalEstimatedRevenue: { $sum: '$totalEstimatedAmount' },
          totalDeposits: { $sum: '$deposit' },
          avgPreOrderValue: { $avg: '$totalEstimatedAmount' },
          preOrdersByStatus: {
            $push: {
              status: '$status',
              amount: '$totalEstimatedAmount',
              deposit: '$deposit'
            }
          }
        }
      }
    ];

    const result = await PreOrder.aggregate(pipeline);
    
    if (result.length === 0) {
      return {
        totalPreOrders: 0,
        totalEstimatedRevenue: 0,
        totalDeposits: 0,
        avgPreOrderValue: 0,
        preOrdersByStatus: {}
      };
    }

    const stats = result[0];
    
    // Group pre-orders by status
    const statusStats = {};
    stats.preOrdersByStatus.forEach(preOrder => {
      if (!statusStats[preOrder.status]) {
        statusStats[preOrder.status] = { count: 0, estimatedRevenue: 0, deposits: 0 };
      }
      statusStats[preOrder.status].count++;
      statusStats[preOrder.status].estimatedRevenue += preOrder.amount;
      statusStats[preOrder.status].deposits += preOrder.deposit;
    });

    return {
      totalPreOrders: stats.totalPreOrders,
      totalEstimatedRevenue: stats.totalEstimatedRevenue,
      totalDeposits: stats.totalDeposits,
      avgPreOrderValue: stats.avgPreOrderValue,
      preOrdersByStatus: statusStats
    };
  }

  // Get recent pre-orders
  async getRecentPreOrders(limit = 10) {
    const preOrders = await PreOrder.find()
      .populate('customer', 'name phone')
      .sort({ orderDate: -1 })
      .limit(limit);

    return preOrders;
  }

  // Search pre-orders
  async searchPreOrders(query) {
    try {
      // Use aggregation pipeline to search by customer name, phone, pre-order code, and notes
    //   const pipeline = [
    //     {
    //       $lookup: {
    //         from: 'customers',
    //         localField: 'customer',
    //         foreignField: '_id',
    //         as: 'customerInfo'
    //       }
    //     },
    //     {
    //       $unwind: '$customerInfo'
    //     },
    //     {
    //       $match: {
    //         $or: [
    //           { 'customerInfo.name': new RegExp(query, 'i') },
    //         //   { 'customerInfo.phone': new RegExp(query, 'i') },
    //         //   { preOrderCode: new RegExp(query, 'i') },
    //         //   { notes: new RegExp(query, 'i') }
    //         ]
    //       }
    //     },
    //     {
    //       $sort: { orderDate: -1 }
    //     }
    //   ];

      const customer = await Customer.find({
        name: new RegExp(query, 'i')
      }).select('_id');

      const customerIds = customer.map(customer => customer._id);

      
      const preOrders = await PreOrder.find({
        customer: { $in: customerIds}
    })
      .populate('customer', 'name phone address')
      .populate('convertedToOrder')
      .sort({ orderDate: -1 });;
      return preOrders;
    } catch (error) {
      console.error('Search pre-orders error:', error);
      throw new Error('Failed to search pre-orders: ' + error.message);
    }
  }

  // Get pre-orders by customer
  async getPreOrdersByCustomer(customerId) {
    const preOrders = await PreOrder.find({ customer: customerId })
      .populate('customer', 'name phone address')
      .populate('convertedToOrder')
      .sort({ orderDate: -1 });

    return preOrders;
  }

  // Get overdue pre-orders
  async getOverduePreOrders() {
    const currentDate = new Date();
    const preOrders = await PreOrder.find({
      expectedDate: { $lt: currentDate },
      status: { $in: ['Chờ hàng'] }
    })
    .populate('customer', 'name phone')
    .sort({ expectedDate: 1 });

    return preOrders;
  }
}

module.exports = new PreOrderService();