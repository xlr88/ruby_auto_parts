const Sale = require('../models/Sale');
const ActiveItem = require('../models/ActiveItem');
const User = require('../models/User'); // Assuming User model is needed for billedBy population
const OnHoldItem = require('../models/OnHoldItem'); // Import OnHoldItem model
const mongoose = require('mongoose');

// @desc    Record a new sale
// @route   POST /api/sales
// @access  Private (Employee/Admin)
const recordSale = async (req, res) => {
  const { customerName, customerContact, itemsSold, discount, discountAmount } = req.body;

  if (!itemsSold || itemsSold.length === 0) {
    return res.status(400).json({ message: 'No items provided for sale' });
  }

  let totalAmount = 0;
  let subTotal = 0; // Initialize subTotal
  let gstAmount = 0; // Initialize gstAmount
  const soldItemsDetails = [];

  try {
    for (const item of itemsSold) {
      const activeItem = await ActiveItem.findById(item.item);

      if (!activeItem) {
        return res.status(404).json({ message: `Item with ID ${item.item} not found` });
      }
      if (activeItem.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${activeItem.name}. Available: ${activeItem.quantity}` });
      }

      // Reduce quantity in active inventory
      activeItem.quantity -= item.quantity;
      if (activeItem.quantity <= 0) {
        await ActiveItem.deleteOne({ _id: activeItem._id });
      } else {
        await activeItem.save();
      }

      // Delete corresponding item from on-hold inventory
      await OnHoldItem.deleteMany({ item: activeItem._id });

      // Add to sold items details for sale record
      soldItemsDetails.push({
        item: activeItem._id,
        quantity: item.quantity,
        priceAtSale: activeItem.price, // Use current price from active inventory
      });

      subTotal += activeItem.price * item.quantity; // Calculate subTotal

      if (activeItem.isTaxable) {
        gstAmount += activeItem.price * item.quantity * 0.18; // Assuming 18% GST
      }
    }

    // Apply discount to the subTotal before calculating final total
    const totalAfterDiscount = subTotal - discountAmount;
    const finalTotal = totalAfterDiscount + gstAmount;

    const sale = await Sale.create({
      customerName,
      customerContact,
      itemsSold: soldItemsDetails,
      discount,
      discountAmount,
      subTotal, // Include subTotal in the sale object
      gstAmount, // Include gstAmount in the sale object
      totalAmount: finalTotal, // Use the calculated finalTotal
      billedBy: req.user._id, // User ID from authenticated request
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private (Employee/Admin)
const getSales = async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};

    if (date) {
      // For filtering by a specific day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.saleDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const sales = await Sale.find(query).populate('billedBy', 'username role').populate('itemsSold.item', 'name price');
    res.status(200).json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single sale by ID
// @route   GET /api/sales/:id
// @access  Private (Employee/Admin)
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('billedBy', 'username role')
      .populate('itemsSold.item', 'name price');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.status(200).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get sales analytics (Daily, Monthly, Total, Filtered)
// @route   GET /api/sales/analytics
// @access  Private (Admin)
const getSalesAnalytics = async (req, res) => {
  try {
    const { year, month } = req.query;
    let matchConditions = {};

    if (year) {
      matchConditions.$expr = {
        $eq: [{ $year: '$saleDate' }, parseInt(year)],
      };
    }
    if (month) {
      matchConditions.$expr = {
        ...matchConditions.$expr,
        $eq: [{ $month: '$saleDate' }, parseInt(month)],
      };
    }

    const analytics = await Sale.aggregate([
      { $match: matchConditions },
      { $unwind: '$itemsSold' },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$itemsSold.priceAtSale' },
          totalItemsSold: { $sum: '$itemsSold.quantity' },
          totalBills: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
          totalItemsSold: 1,
          totalBills: { $size: '$totalBills' },
        },
      },
    ]);

    res.status(200).json(analytics[0] || { totalSales: 0, totalItemsSold: 0, totalBills: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get low stock alerts
// @route   GET /api/sales/lowstock
// @access  Private (Admin)
const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockItems = await ActiveItem.find({ quantity: { $lte: 5 } }); // Threshold of 5
    res.status(200).json(lowStockItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { recordSale, getSales, getSaleById, getSalesAnalytics, getLowStockAlerts };
