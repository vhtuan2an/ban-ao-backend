const express = require('express');
const router = express.Router();
const customerController = require('../controllers/CustomerController');
const { body, param, query } = require('express-validator');


// Routes
router.get('/', 
  customerController.getAllCustomers
);

router.post('/', 
  customerController.createCustomer
);

router.get('/:id',
  customerController.getCustomerById
);

router.get('/:id/history', 
  customerController.getCustomerHistory
);


router.put('/:id', 
  customerController.updateCustomer
);

router.delete('/:id', 
  customerController.deleteCustomer
);

module.exports = router;