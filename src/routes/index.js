const customerRoutes = require('./CustomerRouter');
const productRoutes = require('./ProductRouter');
const orderRoutes = require('./OrderRouter')
const preOrderRoutes = require('./PreOrderRouter');
const invoiceRoutes = require('./InvoiceRouter')

const routes = (app) => {
    // Customer routes
    app.use('/customers', customerRoutes);
    
    // Product routes
    app.use('/products', productRoutes);

    // Order routes
    app.use('/orders', orderRoutes);

    // Pre-order routes
    app.use('/pre-orders', preOrderRoutes);

    // Invoices routes
    app.use('/invoices', invoiceRoutes);
}

module.exports = routes;