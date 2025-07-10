const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');

// Routes for orders
router.get('/', 
  orderController.getAllOrders
);

router.get('/statistics', 
  orderController.getOrderStatistics
);

router.get('/recent', 
  orderController.getRecentOrders
);

router.get('/search', 
  orderController.searchOrders
);

router.post('/', 
  orderController.createOrder
);

router.get('/:id', 
  orderController.getOrderById
);

router.put('/:id', 
  orderController.updateOrder
);

router.patch('/:id/status', 
  orderController.updateOrderStatus
);

router.patch('/:id/payment', 
  orderController.updatePaymentStatus
);

router.delete('/:id', 
  orderController.deleteOrder
);

module.exports = router;