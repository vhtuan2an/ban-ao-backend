const CustomerService = require('../services/CustomerService');
const { validationResult } = require('express-validator');

class CustomerController {
  async getAllCustomers(req, res) {
    try {
      const { search } = req.query;
      
      const filters = { search };
      
      const result = await CustomerService.getAllCustomers(filters);
      
      res.json({
        success: true,
        data: result.customers,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async getCustomerById(req, res) {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      
      res.json({ 
        success: true, 
        data: customer 
      });
    } catch (error) {
      const statusCode = error.message === 'Customer not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async createCustomer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const customer = await CustomerService.createCustomer(req.body);
      
      res.status(201).json({ 
        success: true, 
        data: customer 
      });
    } catch (error) {
      const statusCode = error.message === 'Phone number already exists' ? 409 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async updateCustomer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const customer = await CustomerService.updateCustomer(req.params.id, req.body);
      
      res.json({ 
        success: true, 
        data: customer 
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message === 'Customer not found') statusCode = 404;
      if (error.message === 'Phone number already exists') statusCode = 409;
      
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async deleteCustomer(req, res) {
    try {
      const result = await CustomerService.deleteCustomer(req.params.id);
      
      res.json({ 
        success: true, 
        message: result.message 
      });
    } catch (error) {
      const statusCode = error.message === 'Customer not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async searchByPhone(req, res) {
    try {
      const customer = await CustomerService.searchByPhone(req.params.phone);
      
      res.json({ 
        success: true, 
        data: customer 
      });
    } catch (error) {
      const statusCode = error.message === 'Customer not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async getCustomerHistory(req, res) {
    try {
      
      const result = await CustomerService.getCustomerPurchaseHistory(
        req.params.id, 
      );
      
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
}

module.exports = new CustomerController();