const express = require('express');
const router = express.Router();
const preOrderController = require('../controllers/PreOrderController');

// Routes for pre-orders
router.get('/', 
  preOrderController.getAllPreOrders
);

router.get('/statistics', 
  preOrderController.getPreOrderStatistics
);

router.get('/recent', 
  preOrderController.getRecentPreOrders
);

router.get('/search', 
  preOrderController.searchPreOrders
);

router.get('/overdue', 
  preOrderController.getOverduePreOrders
);

router.post('/', 
  preOrderController.createPreOrder
);

// router.get('/code/:code', 
//   preOrderController.getPreOrderByCode
// );

router.get('/customer/:customerId', 
  preOrderController.getPreOrdersByCustomer
);

router.get('/:id', 
  preOrderController.getPreOrderById
);

router.put('/:id', 
  preOrderController.updatePreOrder
);

router.patch('/:id/status', 
  preOrderController.updatePreOrderStatus
);

router.post('/:id/convert', 
  preOrderController.convertToOrder
);

router.delete('/:id', 
  preOrderController.deletePreOrder
);

module.exports = router;