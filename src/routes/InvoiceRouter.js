const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/InvoiceController');

// Routes for invoices
router.get('/', 
  invoiceController.getAllInvoices
);

router.get('/statistics', 
  invoiceController.getInvoiceStatistics
);

router.get('/recent', 
  invoiceController.getRecentInvoices
);

router.get('/search', 
  invoiceController.searchInvoices
);

router.get('/overdue', 
  invoiceController.getOverdueInvoices
);

router.get('/pending', 
  invoiceController.getPendingPaymentInvoices
);

router.get('/report', 
  invoiceController.generateInvoiceReport
);

// Create invoice from order
router.post('/from-order', 
  invoiceController.createInvoiceFromOrder
);

// Create manual invoice
router.post('/manual', 
  invoiceController.createManualInvoice
);

router.get('/code/:code', 
  invoiceController.getInvoiceByCode
);

router.get('/customer/:customerId', 
  invoiceController.getInvoicesByCustomer
);

router.get('/:id', 
  invoiceController.getInvoiceById
);

router.put('/:id', 
  invoiceController.updateInvoice
);

router.patch('/:id/status', 
  invoiceController.updateInvoiceStatus
);

router.patch('/:id/pay', 
  invoiceController.markAsPaid
);

router.delete('/:id', 
  invoiceController.deleteInvoice
);

module.exports = router;