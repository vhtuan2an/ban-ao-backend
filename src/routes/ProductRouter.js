const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');
const upload = require('../middlewares/multer');

// Routes
router.get('/', 
  productController.getAllProducts
);

router.get('/low-stock', 
  productController.getLowStockProducts
);

// Create product with multiple images
router.post('/',
  upload.array('images', 10),
  productController.createProduct
);

router.get('/:id', 
  productController.getProductById
);

// Update product with multiple images (replace all images)
router.put('/:id',
  upload.array('images', 10),
  productController.updateProduct
);

// Add more images to existing product
router.post('/:id/images',
  upload.array('images', 10),
  productController.addImages
);

// Remove specific image from product
router.delete('/:id/images',
  productController.removeImage
);

router.patch('/:id/quantity', 
  productController.updateQuantity
);

router.delete('/:id', 
  productController.deleteProduct
);

module.exports = router;