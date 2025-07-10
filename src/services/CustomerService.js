const Customer = require('../models/Customer');

class CustomerService {
  async getAllCustomers(filters) {
    const { search } = filters;
    
    const filter = { isActive: true };
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(filter);

    return {
      customers
    };
  }

  async getCustomerById(id) {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }

  async createCustomer(customerData) {
    // Business logic: Check if phone number already exists
    const existingCustomer = await Customer.findOne({ 
      phone: customerData.phone,
      isActive: true 
    });

    if (existingCustomer) {
      throw new Error('Phone number already exists');
    }

    const customer = new Customer(customerData);
    await customer.save();
    return customer;
  }

  async updateCustomer(id, updateData) {
    // Business logic: Check phone uniqueness if phone is being updated
    if (updateData.phone) {
      const existingCustomer = await Customer.findOne({ 
        phone: updateData.phone,
        _id: { $ne: id },
        isActive: true
      });

      if (existingCustomer) {
        throw new Error('Phone number already exists');
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  async deleteCustomer(id) {
    const customer = await Customer.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      throw new Error('Customer not found');
    }

    return { message: 'Customer deleted successfully' };
  }

  async searchByPhone(phone) {
    const customer = await Customer.findOne({ phone, isActive: true });
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }

  async getCustomerPurchaseHistory(customerId, pagination) {
    const Order = require('../models/OrderItem');
    const { page = 1, limit = 10 } = pagination;
    
    const orders = await Order.find({ customer: customerId })
      .populate('customer', 'name phone')
      .populate('items.product', 'teamName category size')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ orderDate: -1 });

    const total = await Order.countDocuments({ customer: customerId });

    return {
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    };
  }
}

module.exports = new CustomerService();