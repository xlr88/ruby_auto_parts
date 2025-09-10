const OnHoldItem = require('../models/OnHoldItem');
const ActiveItem = require('../models/ActiveItem');
const { generateQrCodeAndUpload } = require('../utils/qrAndUpload');

// @desc    Add item to On-Hold Inventory
// @route   POST /api/onhold
// @access  Private/Employee
const addOnHoldItem = async (req, res) => {
  const { name, price, tags, brand, quantity, isTaxable } = req.body;

  // Generate unique code
  const timestamp = new Date();
  const date = timestamp.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const time = timestamp.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  const uniqueCode = `${date}_${time}_${randomString}`;

  try {
    const qrCodeUrl = await generateQrCodeAndUpload(uniqueCode);

    const onHoldItem = await OnHoldItem.create({
      uniqueCode,
      name,
      price,
      tags,
      brand,
      quantity,
      qrCodeUrl,
      isTaxable,
      addedBy: req.user._id, // Assuming req.user is set by auth middleware
      status: 'pending',
    });

    res.status(201).json(onHoldItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not add item to On-Hold Inventory' });
  }
};

// @desc    Get all On-Hold Items
// @route   GET /api/onhold
// @access  Private/Admin, Employee
const getOnHoldItems = async (req, res) => {
  try {
    const onHoldItems = await OnHoldItem.find({}).populate('addedBy', 'username').populate('approvedBy', 'username');
    res.json(onHoldItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not retrieve On-Hold Inventory' });
  }
};

// @desc    Approve an On-Hold Item (move to Active Inventory)
// @route   PUT /api/onhold/:id/approve
// @access  Private/Admin
const approveOnHoldItem = async (req, res) => {
  try {
    const onHoldItem = await OnHoldItem.findById(req.params.id);

    if (!onHoldItem) {
      return res.status(404).json({ message: 'On-Hold Item not found' });
    }

    // Create ActiveItem
    const activeItem = await ActiveItem.create({
      uniqueCode: onHoldItem.uniqueCode,
      name: onHoldItem.name,
      price: onHoldItem.price,
      tags: onHoldItem.tags,
      brand: onHoldItem.brand,
      quantity: onHoldItem.quantity,
      qrCodeUrl: onHoldItem.qrCodeUrl,
      isTaxable: onHoldItem.isTaxable,
      addedBy: onHoldItem.addedBy,
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    // Update OnHoldItem status
    onHoldItem.status = 'approved';
    onHoldItem.approvedBy = req.user._id;
    await onHoldItem.save();
    await onHoldItem.deleteOne(); // Delete the on-hold item after it's approved

    res.json({ message: 'Item approved and moved to Active Inventory', activeItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not approve item' });
  }
};

// @desc    Reject an On-Hold Item
// @route   PUT /api/onhold/:id/reject
// @access  Private/Admin
const rejectOnHoldItem = async (req, res) => {
  try {
    const onHoldItem = await OnHoldItem.findById(req.params.id);

    if (!onHoldItem) {
      return res.status(404).json({ message: 'On-Hold Item not found' });
    }

    onHoldItem.status = 'rejected';
    await onHoldItem.save();

    res.json({ message: 'On-Hold Item rejected', onHoldItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not reject item' });
  }
};

// @desc    Delete an On-Hold Item
// @route   DELETE /api/onhold/:id
// @access  Private/Admin
const deleteOnHoldItem = async (req, res) => {
  try {
    const onHoldItem = await OnHoldItem.findById(req.params.id);

    if (!onHoldItem) {
      return res.status(404).json({ message: 'On-Hold Item not found' });
    }

    await onHoldItem.deleteOne();

    res.json({ message: 'On-Hold Item removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not delete item' });
  }
};

module.exports = { addOnHoldItem, getOnHoldItems, approveOnHoldItem, rejectOnHoldItem, deleteOnHoldItem };
