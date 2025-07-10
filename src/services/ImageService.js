const cloudinary = require('../configs/cloudinary');

class ImageService {
  // Upload single image to Cloudinary
  async uploadImage(file, options = {}) {
    try {
      const defaultOptions = {
        folder: 'ban-ao/products',
        resource_type: 'image',
      };
      
      const uploadOptions = { ...defaultOptions, ...options };
      
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      throw new Error('Failed to upload image: ' + error.message);
    }
  }

  // Upload multiple images to Cloudinary
  async uploadMultipleImages(files, options = {}) {
    try {
      if (!files || files.length === 0) return [];
      
      const uploadPromises = files.map(file => this.uploadImage(file, options));
      const results = await Promise.all(uploadPromises);
      
      return results;
    } catch (error) {
      throw new Error('Failed to upload images: ' + error.message);
    }
  }

  // Delete image from Cloudinary using public_id
  async deleteImage(publicId) {
    try {
      if (!publicId) return;
      
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
      throw new Error('Failed to delete image: ' + error.message);
    }
  }

  // Delete image from Cloudinary using URL
  async deleteImageByUrl(imageUrl) {
    try {
      if (!imageUrl) return;
      
      // Extract public_id from Cloudinary URL
      const publicId = this.extractPublicIdFromUrl(imageUrl);
      return await this.deleteImage(publicId);
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
    }
  }

  // Delete multiple images from Cloudinary
  async deleteMultipleImages(imageUrls) {
    try {
      if (!imageUrls || imageUrls.length === 0) return;
      
      const deletePromises = imageUrls.map(url => this.deleteImageByUrl(url));
      const results = await Promise.all(deletePromises);
      return results;
    } catch (error) {
      console.error('Failed to delete multiple images:', error);
      throw new Error('Failed to delete images: ' + error.message);
    }
  }

  // Extract public_id from Cloudinary URL
  extractPublicIdFromUrl(imageUrl) {
    try {
      // Example URL: https://res.cloudinary.com/dcg7cptpe/image/upload/v1234567890/ban-ao/products/abc123.jpg
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      
      if (uploadIndex === -1) {
        throw new Error('Invalid Cloudinary URL format');
      }
      
      // Get everything after 'upload/v{version}/'
      const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
      
      // Remove file extension
      const publicId = pathAfterVersion.replace(/\.[^/.]+$/, '');
      
      return publicId;
    } catch (error) {
      console.error('Error extracting public_id from URL:', error);
      // Fallback method for simple URLs
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      return `ban-ao/products/${fileName.split('.')[0]}`;
    }
  }

  // Get image details from Cloudinary
  async getImageDetails(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at
      };
    } catch (error) {
      throw new Error('Failed to get image details: ' + error.message);
    }
  }

  // Transform image (resize, crop, etc.)
  async transformImage(publicId, transformations) {
    try {
      const transformedUrl = cloudinary.url(publicId, transformations);
      return transformedUrl;
    } catch (error) {
      throw new Error('Failed to transform image: ' + error.message);
    }
  }

  // Upload image with automatic optimization
  async uploadOptimizedImage(file, options = {}) {
    const optimizationOptions = {
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };
    
    return await this.uploadImage(file, optimizationOptions);
  }

  // Upload multiple images with different sizes/transformations
  async uploadWithVariants(file, variants = [], options = {}) {
    try {
      const baseUpload = await this.uploadImage(file, options);
      const variantPromises = variants.map(variant => 
        this.transformImage(baseUpload.publicId, variant)
      );
      
      const variantUrls = await Promise.all(variantPromises);
      
      return {
        original: baseUpload,
        variants: variantUrls
      };
    } catch (error) {
      throw new Error('Failed to upload image variants: ' + error.message);
    }
  }
}

module.exports = new ImageService();