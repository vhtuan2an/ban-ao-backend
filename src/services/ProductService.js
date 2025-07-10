const Product = require('../models/Product');
const ImageService = require('./ImageService');

class ProductService {
  // Get all products with filtering and pagination
  async getAllProducts(filters) {
    const { teamName, category, size, search } = filters;
    
    const filter = { isActive: true };
    
    if (teamName) filter.teamName = new RegExp(teamName, 'i');
    if (category) filter.category = category;
    if (size) filter.size = size;
    if (search) {
      filter.$or = [
        { teamName: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    return {
      products,
    };
  }

  // Get product by ID
  async getProductById(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  // Create new product
  async createProduct(productData, imageFiles) {
    // Business logic: Check if product already exists
    const existingProduct = await Product.findOne({
      teamName: productData.teamName,
      category: productData.category,
      size: productData.size,
      type: productData.type
    });

    if (existingProduct) {
      throw new Error('Product with same team, category, size and type already exists');
    }

    // Upload images if provided using ImageService
    let imageUrls = [];
    if (imageFiles && imageFiles.length > 0) {
      const uploadResults = await ImageService.uploadMultipleImages(imageFiles, {
        folder: 'ban-ao/products',
        quality: 'auto',
        fetch_format: 'auto'
      });
      
      // Extract URLs from upload results
      imageUrls = uploadResults.map(result => result.url);
    }

    const product = new Product({
      ...productData,
      images: imageUrls
    });

    await product.save();
    return product;
  }

  // Update product
  async updateProduct(id, updateData, imageFiles) {
    // Business logic: Validate update data
    if (updateData.quantity !== undefined && updateData.quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Handle image update
    if (imageFiles && imageFiles.length > 0) {
      // Delete old images if exists
      if (product.images && product.images.length > 0) {
        await ImageService.deleteMultipleImages(product.images);
      }
      
      // Upload new images using ImageService
      const uploadResults = await ImageService.uploadMultipleImages(imageFiles, {
        folder: 'ban-ao/products',
        quality: 'auto',
        fetch_format: 'auto'
      });
      
      // Extract URLs from upload results
      updateData.images = uploadResults.map(result => result.url);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return updatedProduct;
  }

  // Add images to existing product
  async addImages(id, imageFiles) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('No images provided');
    }

    // Upload new images using ImageService
    const uploadResults = await ImageService.uploadMultipleImages(imageFiles, {
      folder: 'ban-ao/products',
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    // Extract URLs and add to existing images
    const newImageUrls = uploadResults.map(result => result.url);
    product.images.push(...newImageUrls);
    await product.save();

    return product;
  }

  // Remove specific image from product
  async removeImage(id, imageUrl) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    const imageIndex = product.images.findIndex(url => url === imageUrl);
    if (imageIndex === -1) {
      throw new Error('Image not found');
    }

    // Delete from Cloudinary using ImageService
    await ImageService.deleteImageByUrl(imageUrl);
    
    // Remove from product
    product.images.splice(imageIndex, 1);
    await product.save();

    return product;
  }

  // Update product quantity
  async updateQuantity(id, quantity, operation) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    if (operation === 'add') {
      product.quantity += quantity;
    } else if (operation === 'subtract') {
      if (product.quantity < quantity) {
        throw new Error('Not enough quantity in stock');
      }
      product.quantity -= quantity;
    } else {
      throw new Error('Invalid operation. Use "add" or "subtract"');
    }

    await product.save();
    return product;
  }

  // Soft delete product
  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    // Delete all images from Cloudinary using ImageService
    if (product.images && product.images.length > 0) {
      await ImageService.deleteMultipleImages(product.images);
    }

    const deletedProduct = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    return { message: 'Product deleted successfully' };
  }

  // Get low stock products
  async getLowStockProducts(threshold = 5) {
    const products = await Product.find({
      isActive: true,
      quantity: { $lte: threshold }
    }).sort({ quantity: 1 });

    return products;
  }

  // Business logic: Check product availability
  async checkProductAvailability(productId, requiredQuantity) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not active');
    }

    if (product.quantity < requiredQuantity) {
      throw new Error(`Not enough stock. Available: ${product.quantity}, Required: ${requiredQuantity}`);
    }

    return true;
  }

  // Business logic: Reduce stock when order is placed
  async reduceStock(productId, quantity) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    product.quantity -= quantity;
    await product.save();
    
    return product;
  }

  // Business logic: Restore stock when order is cancelled
  async restoreStock(productId, quantity) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    product.quantity += quantity;
    await product.save();
    
    return product;
  }

  // Get optimized image URLs for product
  async getOptimizedProductImages(productId, transformations = {}) {
    const product = await this.getProductById(productId);
    
    if (!product.images || product.images.length === 0) {
      return [];
    }

    const optimizedImages = await Promise.all(
      product.images.map(async (imageUrl) => {
        const publicId = ImageService.extractPublicIdFromUrl(imageUrl);
        return ImageService.transformImage(publicId, transformations);
      })
    );

    return optimizedImages;
  }
}

module.exports = new ProductService();