const OrderService = require('../services/OrderService');

class OrderController {
  // Get all orders with filtering and pagination
  async getAllOrders(req, res) {
    try {
      const filters = req.query;
      
      const result = await OrderService.getAllOrders(filters);
      
      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get order by ID
  async getOrderById(req, res) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      
      res.json({ 
        success: true, 
        data: order 
      });
    } catch (error) {
      const statusCode = error.message === 'Order not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }


  // Create new order
  async createOrder(req, res) {
    try {
      const order = await OrderService.createOrder(req.body);
      
      res.status(201).json({ 
        success: true, 
        data: order 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Customer not found') statusCode = 404;
      if (error.message.includes('Not enough stock') || error.message.includes('not active')) statusCode = 400;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Update order
  async updateOrder(req, res) {
    try {
      const order = await OrderService.updateOrder(req.params.id, req.body);
      
      res.json({ 
        success: true, 
        data: order 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Order not found') statusCode = 404;
      if (error.message.includes('Cannot update')) statusCode = 400;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const order = await OrderService.updateOrderStatus(req.params.id, status);
      
      res.json({ 
        success: true, 
        data: order 
      });
    } catch (error) {
      const statusCode = error.message === 'Order not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Update payment status
  async updatePaymentStatus(req, res) {
    try {
      const { paymentStatus, paymentMethod } = req.body;
      const order = await OrderService.updatePaymentStatus(req.params.id, paymentStatus, paymentMethod);
      
      res.json({ 
        success: true, 
        data: order 
      });
    } catch (error) {
      const statusCode = error.message === 'Order not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Delete order
  async deleteOrder(req, res) {
    try {
      const result = await OrderService.deleteOrder(req.params.id);
      
      res.json({ 
        success: true, 
        message: result.message 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Order not found') statusCode = 404;
      if (error.message.includes('Cannot delete')) statusCode = 400;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get order statistics
  async getOrderStatistics(req, res) {
    try {
      const filters = req.query;
      const stats = await OrderService.getOrderStatistics(filters);
      
      res.json({ 
        success: true, 
        data: stats 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get recent orders
  async getRecentOrders(req, res) {
    try {
      const { limit } = req.query;
      const orders = await OrderService.getRecentOrders(parseInt(limit));
      
      res.json({ 
        success: true, 
        data: orders 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Search orders
  async searchOrders(req, res) {
    try {
      const { query } = req.query;
      const orders = await OrderService.searchOrders(query);
      
      res.json({ 
        success: true, 
        data: orders 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new OrderController();