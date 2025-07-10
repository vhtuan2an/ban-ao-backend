const InvoiceService = require('../services/InvoiceService');

class InvoiceController {
  // Get all invoices with filtering
  async getAllInvoices(req, res) {
    try {
      const filters = req.query;
      
      const result = await InvoiceService.getAllInvoices(filters);
      
      res.json({
        success: true,
        data: result.invoices
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get invoice by ID
  async getInvoiceById(req, res) {
    try {
      const invoice = await InvoiceService.getInvoiceById(req.params.id);
      
      res.json({ 
        success: true, 
        data: invoice 
      });
    } catch (error) {
      const statusCode = error.message === 'Invoice not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get invoice by code
  async getInvoiceByCode(req, res) {
    try {
      const invoice = await InvoiceService.getInvoiceByCode(req.params.code);
      
      res.json({ 
        success: true, 
        data: invoice 
      });
    } catch (error) {
      const statusCode = error.message === 'Invoice not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Create invoice from order
  async createInvoiceFromOrder(req, res) {
    try {
      const invoice = await InvoiceService.createInvoiceFromOrder(req.body);
      
      res.status(201).json({ 
        success: true, 
        data: invoice 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Order not found') statusCode = 404;
      if (error.message === 'Invoice already exists for this order') statusCode = 409;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Create manual invoice
  async createManualInvoice(req, res) {
    try {
      const invoice = await InvoiceService.createManualInvoice(req.body);
      
      res.status(201).json({ 
        success: true, 
        data: invoice 
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

  // Update invoice
  async updateInvoice(req, res) {
    try {
      const invoice = await InvoiceService.updateInvoice(req.params.id, req.body);
      
      res.json({ 
        success: true, 
        data: invoice 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Invoice not found') statusCode = 404;
      if (error.message.includes('Cannot update')) statusCode = 400;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Update invoice status
  async updateInvoiceStatus(req, res) {
    try {
      const { status } = req.body;
      const invoice = await InvoiceService.updateInvoiceStatus(req.params.id, status);
      
      res.json({ 
        success: true, 
        data: invoice 
      });
    } catch (error) {
      const statusCode = error.message === 'Invoice not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Mark invoice as paid
  async markAsPaid(req, res) {
    try {
      const invoice = await InvoiceService.markAsPaid(req.params.id, req.body);
      
      res.json({ 
        success: true, 
        data: invoice 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Invoice not found') statusCode = 404;
      if (error.message === 'Invoice is already paid') statusCode = 400;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Delete invoice
  async deleteInvoice(req, res) {
    try {
      const result = await InvoiceService.deleteInvoice(req.params.id);
      
      res.json({ 
        success: true, 
        message: result.message 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Invoice not found') statusCode = 404;
      if (error.message.includes('Cannot delete')) statusCode = 400;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get invoice statistics
  async getInvoiceStatistics(req, res) {
    try {
      const filters = req.query;
      const stats = await InvoiceService.getInvoiceStatistics(filters);
      
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

  // Get recent invoices
  async getRecentInvoices(req, res) {
    try {
      const { limit } = req.query;
      const invoices = await InvoiceService.getRecentInvoices(parseInt(limit));
      
      res.json({ 
        success: true, 
        data: invoices 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Search invoices
  async searchInvoices(req, res) {
    try {
      const { query } = req.query;
      const invoices = await InvoiceService.searchInvoices(query);
      
      res.json({ 
        success: true, 
        data: invoices 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get invoices by customer
  async getInvoicesByCustomer(req, res) {
    try {
      const invoices = await InvoiceService.getInvoicesByCustomer(req.params.customerId);
      
      res.json({ 
        success: true, 
        data: invoices 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get overdue invoices
  async getOverdueInvoices(req, res) {
    try {
      const invoices = await InvoiceService.getOverdueInvoices();
      
      res.json({ 
        success: true, 
        data: invoices 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get pending payment invoices
  async getPendingPaymentInvoices(req, res) {
    try {
      const invoices = await InvoiceService.getPendingPaymentInvoices();
      
      res.json({ 
        success: true, 
        data: invoices 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Generate invoice report
  async generateInvoiceReport(req, res) {
    try {
      const filters = req.query;
      const report = await InvoiceService.generateInvoiceReport(filters);
      
      res.json({ 
        success: true, 
        data: report 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new InvoiceController();