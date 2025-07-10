const ProductService = require('../services/ProductService');

class ProductController {
  // Get all products with filtering and pagination
  async getAllProducts(req, res) {
    try {
      const { teamName, category, size, search } = req.query;
      
      const filters = { teamName, category, size, search };
      
      const result = await ProductService.getAllProducts(filters);
      
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      
      res.json({ 
        success: true, 
        data: product 
      });
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Create new product
  async createProduct(req, res) {
    try {
      const product = await ProductService.createProduct(req.body, req.files);
      
      res.status(201).json({ 
        success: true, 
        data: product 
      });
    } catch (error) {
      const statusCode = error.message.includes('already exists') ? 409 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Update product
  async updateProduct(req, res) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body, req.files);
      
      res.json({ 
        success: true, 
        data: product 
      });
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Add images to existing product
  async addImages(req, res) {
    try {
      const product = await ProductService.addImages(req.params.id, req.files);
      
      res.json({ 
        success: true, 
        data: product 
      });
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 400;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Remove specific image from product
  async removeImage(req, res) {
    try {
      const { imageUrl } = req.body;
      const product = await ProductService.removeImage(req.params.id, imageUrl);
      
      res.json({ 
        success: true, 
        data: product 
      });
    } catch (error) {
      const statusCode = error.message === 'Product not found' || error.message === 'Image not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Update product quantity
  async updateQuantity(req, res) {
    try {
      const { quantity, operation } = req.body;
      
      const product = await ProductService.updateQuantity(
        req.params.id, 
        quantity, 
        operation
      );
      
      res.json({ 
        success: true, 
        data: product 
      });
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 400;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Delete product (soft delete)
  async deleteProduct(req, res) {
    try {
      const result = await ProductService.deleteProduct(req.params.id);
      
      res.json({ 
        success: true, 
        message: result.message 
      });
    } catch (error) {
      const statusCode = error.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  // Get low stock products
  async getLowStockProducts(req, res) {
    try {
      const { threshold } = req.query;
      
      const products = await ProductService.getLowStockProducts(threshold);
      
      res.json({ 
        success: true, 
        data: products 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

module.exports = new ProductController();