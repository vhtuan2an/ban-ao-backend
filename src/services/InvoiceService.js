const Invoice = require('../models/Invoice');
const Order = require('../models/OrderItem');
const Customer = require('../models/Customer');

class InvoiceService {
  // Get all invoices with filtering
  async getAllInvoices(filters) {
    const { customerName, status, paymentMethod, startDate, endDate, invoiceCode } = filters;
    
    const filter = {};
    
    // Filter by invoice code
    if (invoiceCode) {
      filter.invoiceCode = new RegExp(invoiceCode, 'i');
    }
    
    // Filter by status
    if (status) {
      filter.status = status;
    }
    
    // Filter by payment method
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    // Build aggregation pipeline for customer name filtering
    let pipeline = [
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: '$customerInfo'
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderInfo'
        }
      },
      {
        $unwind: '$orderInfo'
      }
    ];

    // Add customer name filter if provided
    if (customerName) {
      pipeline.push({
        $match: {
          'customerInfo.name': new RegExp(customerName, 'i')
        }
      });
    }

    // Add other filters
    if (Object.keys(filter).length > 0) {
      pipeline.push({
        $match: filter
      });
    }

    // Add sorting
    pipeline.push({
      $sort: { issueDate: -1 }
    });

    const invoices = await Invoice.aggregate(pipeline);

    return {
      invoices
    };
  }

  // Get invoice by ID
  async getInvoiceById(id) {
    const invoice = await Invoice.findById(id)
      .populate('customer', 'name phone address')
      .populate({
        path: 'order',
        populate: {
          path: 'items.product',
          select: 'name teamName category size images'
        }
      });
      
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  }

  // Get invoice by code
  async getInvoiceByCode(invoiceCode) {
    const invoice = await Invoice.findOne({ invoiceCode })
      .populate('customer', 'name phone address')
      .populate({
        path: 'order',
        populate: {
          path: 'items.product',
          select: 'name teamName category size images'
        }
      });
      
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  }

  // Create new invoice from order
  async createInvoiceFromOrder(invoiceData) {
    const { orderId, paymentMethod, paymentNotes, dueDate, notes } = invoiceData;

    // Validate order exists
    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      throw new Error('Order not found');
    }

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ order: orderId });
    if (existingInvoice) {
      throw new Error('Invoice already exists for this order');
    }

    // Create invoice
    const invoice = new Invoice({
      order: orderId,
      customer: order.customer._id,
      totalAmount: order.totalAmount,
      paymentMethod: paymentMethod || order.paymentMethod,
      paymentNotes: paymentNotes || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || ''
    });

    await invoice.save();

    // Populate invoice details before returning
    const populatedInvoice = await this.getInvoiceById(invoice._id);
    return populatedInvoice;
  }

  // Create manual invoice (without order)
  async createManualInvoice(invoiceData) {
    const { customerId, totalAmount, paymentMethod, paymentNotes, dueDate, notes } = invoiceData;

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create manual invoice
    const invoice = new Invoice({
      customer: customerId,
      totalAmount,
      paymentMethod: paymentMethod || 'Tiền mặt',
      paymentNotes: paymentNotes || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || '',
      status: 'Đã xuất'
    });

    await invoice.save();

    // Populate invoice details before returning
    const populatedInvoice = await this.getInvoiceById(invoice._id);
    return populatedInvoice;
  }

  // Update invoice
  async updateInvoice(id, updateData) {
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Prevent updating paid or cancelled invoices
    if (invoice.status === 'Đã thanh toán' || invoice.status === 'Đã hủy') {
      throw new Error('Cannot update paid or cancelled invoices');
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return await this.getInvoiceById(updatedInvoice._id);
  }

  // Update invoice status
  async updateInvoiceStatus(id, status) {
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Auto-update related order payment status if invoice is paid
    if (status === 'Đã thanh toán' && invoice.order) {
      await Order.findByIdAndUpdate(
        invoice.order,
        { paymentStatus: 'Đã thanh toán' }
      );
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    return await this.getInvoiceById(updatedInvoice._id);
  }

  // Mark invoice as paid
  async markAsPaid(id, paymentData) {
    const { paymentMethod, paymentNotes } = paymentData;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'Đã thanh toán') {
      throw new Error('Invoice is already paid');
    }

    const updateData = {
      status: 'Đã thanh toán'
    };

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (paymentNotes) {
      updateData.paymentNotes = paymentNotes;
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Update related order payment status
    if (invoice.order) {
      await Order.findByIdAndUpdate(
        invoice.order,
        { paymentStatus: 'Đã thanh toán' }
      );
    }

    return await this.getInvoiceById(updatedInvoice._id);
  }

  // Delete invoice (soft delete by cancelling)
  async deleteInvoice(id) {
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'Đã thanh toán') {
      throw new Error('Cannot delete paid invoices');
    }

    // Update status to cancelled
    await Invoice.findByIdAndUpdate(id, { status: 'Đã hủy' });

    return { message: 'Invoice cancelled successfully' };
  }

  // Get invoice statistics
  async getInvoiceStatistics(filters = {}) {
    const { startDate, endDate } = filters;
    
    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.issueDate = {};
      if (startDate) matchFilter.issueDate.$gte = new Date(startDate);
      if (endDate) matchFilter.issueDate.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          avgInvoiceValue: { $avg: '$totalAmount' },
          invoicesByStatus: {
            $push: {
              status: '$status',
              amount: '$totalAmount'
            }
          },
          invoicesByPaymentMethod: {
            $push: {
              paymentMethod: '$paymentMethod',
              amount: '$totalAmount'
            }
          }
        }
      }
    ];

    const result = await Invoice.aggregate(pipeline);
    
    if (result.length === 0) {
      return {
        totalInvoices: 0,
        totalAmount: 0,
        avgInvoiceValue: 0,
        invoicesByStatus: {},
        invoicesByPaymentMethod: {}
      };
    }

    const stats = result[0];
    
    // Group invoices by status
    const statusStats = {};
    stats.invoicesByStatus.forEach(invoice => {
      if (!statusStats[invoice.status]) {
        statusStats[invoice.status] = { count: 0, amount: 0 };
      }
      statusStats[invoice.status].count++;
      statusStats[invoice.status].amount += invoice.amount;
    });

    // Group invoices by payment method
    const paymentMethodStats = {};
    stats.invoicesByPaymentMethod.forEach(invoice => {
      if (!paymentMethodStats[invoice.paymentMethod]) {
        paymentMethodStats[invoice.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentMethodStats[invoice.paymentMethod].count++;
      paymentMethodStats[invoice.paymentMethod].amount += invoice.amount;
    });

    return {
      totalInvoices: stats.totalInvoices,
      totalAmount: stats.totalAmount,
      avgInvoiceValue: stats.avgInvoiceValue,
      invoicesByStatus: statusStats,
      invoicesByPaymentMethod: paymentMethodStats
    };
  }

  // Get recent invoices
  async getRecentInvoices(limit = 10) {
    const invoices = await Invoice.find()
      .populate('customer', 'name phone')
      .populate('order', 'orderDate totalAmount')
      .sort({ issueDate: -1 })
      .limit(limit);

    return invoices;
  }

  // Search invoices
  async searchInvoices(query) {
    try {
      // Use aggregation pipeline to search by customer name, phone, invoice code, and notes
      const pipeline = [
        {
          $lookup: {
            from: 'customers',
            localField: 'customer',
            foreignField: '_id',
            as: 'customerInfo'
          }
        },
        {
          $unwind: '$customerInfo'
        },
        {
          $match: {
            $or: [
              { 'customerInfo.name': new RegExp(query, 'i') },
              { 'customerInfo.phone': new RegExp(query, 'i') },
              { invoiceCode: new RegExp(query, 'i') },
              { notes: new RegExp(query, 'i') },
              { paymentNotes: new RegExp(query, 'i') }
            ]
          }
        },
        {
          $lookup: {
            from: 'orders',
            localField: 'order',
            foreignField: '_id',
            as: 'orderInfo'
          }
        },
        {
          $sort: { issueDate: -1 }
        }
      ];

      const invoices = await Invoice.aggregate(pipeline);
      return invoices;
    } catch (error) {
      console.error('Search invoices error:', error);
      throw new Error('Failed to search invoices: ' + error.message);
    }
  }

  // Get invoices by customer
  async getInvoicesByCustomer(customerId) {
    const invoices = await Invoice.find({ customer: customerId })
      .populate('customer', 'name phone address')
      .populate('order', 'orderDate totalAmount items')
      .sort({ issueDate: -1 });

    return invoices;
  }

  // Get overdue invoices
  async getOverdueInvoices() {
    const currentDate = new Date();
    const invoices = await Invoice.find({
      dueDate: { $lt: currentDate },
      status: { $in: ['Đã xuất'] }
    })
    .populate('customer', 'name phone')
    .populate('order', 'orderDate')
    .sort({ dueDate: 1 });

    return invoices;
  }

  // Get pending payment invoices
  async getPendingPaymentInvoices() {
    const invoices = await Invoice.find({
      status: 'Đã xuất'
    })
    .populate('customer', 'name phone')
    .populate('order', 'orderDate totalAmount')
    .sort({ issueDate: -1 });

    return invoices;
  }

  // Generate invoice report
  async generateInvoiceReport(filters = {}) {
    const { startDate, endDate, status, paymentMethod } = filters;
    
    const matchFilter = {};
    
    if (startDate || endDate) {
      matchFilter.issueDate = {};
      if (startDate) matchFilter.issueDate.$gte = new Date(startDate);
      if (endDate) matchFilter.issueDate.$lte = new Date(endDate);
    }
    
    if (status) {
      matchFilter.status = status;
    }
    
    if (paymentMethod) {
      matchFilter.paymentMethod = paymentMethod;
    }

    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: '$customerInfo'
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderInfo'
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$issueDate' },
            year: { $year: '$issueDate' },
            status: '$status'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          invoices: {
            $push: {
              invoiceCode: '$invoiceCode',
              customerName: '$customerInfo.name',
              customerPhone: '$customerInfo.phone',
              totalAmount: '$totalAmount',
              status: '$status',
              paymentMethod: '$paymentMethod',
              issueDate: '$issueDate',
              dueDate: '$dueDate'
            }
          }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ];

    const reportData = await Invoice.aggregate(pipeline);
    
    return {
      reportData,
      summary: {
        totalInvoices: reportData.reduce((sum, item) => sum + item.count, 0),
        totalAmount: reportData.reduce((sum, item) => sum + item.totalAmount, 0)
      }
    };
  }
}

module.exports = new InvoiceService();