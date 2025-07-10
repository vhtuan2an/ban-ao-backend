const PreOrderService = require('../services/PreOrderService');

class PreOrderController {
  // Get all pre-orders with filtering
  async getAllPreOrders(req, res) {
    try {
      const filters = req.query;
      
      const result = await PreOrderService.getAllPreOrders(filters);
      
      res.json({
        success: true,
        data: result.preOrders
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get pre-order by ID
  async getPreOrderById(req, res) {
    try {
      const preOrder = await PreOrderService.getPreOrderById(req.params.id);
      
      res.json({ 
        success: true, 
        data: preOrder 
      });
    } catch (error) {
      const statusCode = error.message === 'Pre-order not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get pre-order by code
//   async getPreOrderByCode(req, res) {
//     try {
//       const preOrder = await PreOrderService.getPreOrderByCode(req.params.code);
      
//       res.json({ 
//         success: true, 
//         data: preOrder 
//       });
//     } catch (error) {
//       const statusCode = error.message === 'Pre-order not found' ? 404 : 500;
//       res.status(statusCode).json({ 
//         success: false, 
//         error: error.message 
//       });
//     }
//   }

  // Create new pre-order
  async createPreOrder(req, res) {
    try {
      const preOrder = await PreOrderService.createPreOrder(req.body);
      
      res.status(201).json({ 
        success: true, 
        data: preOrder 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Customer not found') statusCode = 404;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Update pre-order
  async updatePreOrder(req, res) {
    try {
      const preOrder = await PreOrderService.updatePreOrder(req.params.id, req.body);
      
      res.json({ 
        success: true, 
        data: preOrder 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Pre-order not found') statusCode = 404;
      if (error.message.includes('Cannot update')) statusCode = 400;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Update pre-order status
  async updatePreOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const preOrder = await PreOrderService.updatePreOrderStatus(req.params.id, status);
      
      res.json({ 
        success: true, 
        data: preOrder 
      });
    } catch (error) {
      const statusCode = error.message === 'Pre-order not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Convert pre-order to order
  async convertToOrder(req, res) {
    try {
      const result = await PreOrderService.convertToOrder(req.params.id, req.body);
      
      res.json({ 
        success: true, 
        data: result 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Pre-order not found') statusCode = 404;
      if (error.message.includes('must have status') || error.message.includes('already been converted') || error.message.includes('Not enough stock')) statusCode = 400;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Delete pre-order
  async deletePreOrder(req, res) {
    try {
      const result = await PreOrderService.deletePreOrder(req.params.id);
      
      res.json({ 
        success: true, 
        message: result.message 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Pre-order not found') statusCode = 404;
      if (error.message.includes('Cannot delete')) statusCode = 400;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get pre-order statistics
  async getPreOrderStatistics(req, res) {
    try {
      const filters = req.query;
      const stats = await PreOrderService.getPreOrderStatistics(filters);
      
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

  // Get recent pre-orders
  async getRecentPreOrders(req, res) {
    try {
      const { limit } = req.query;
      const preOrders = await PreOrderService.getRecentPreOrders(parseInt(limit));
      
      res.json({ 
        success: true, 
        data: preOrders 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Search pre-orders
  async searchPreOrders(req, res) {
    try {
      const { query } = req.query;
      const preOrders = await PreOrderService.searchPreOrders(query);
      
      res.json({ 
        success: true, 
        data: preOrders 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get pre-orders by customer
  async getPreOrdersByCustomer(req, res) {
    try {
      const preOrders = await PreOrderService.getPreOrdersByCustomer(req.params.customerId);
      
      res.json({ 
        success: true, 
        data: preOrders 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get overdue pre-orders
  async getOverduePreOrders(req, res) {
    try {
      const preOrders = await PreOrderService.getOverduePreOrders();
      
      res.json({ 
        success: true, 
        data: preOrders 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new PreOrderController();