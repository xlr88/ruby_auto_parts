const mongoose = require('mongoose');

const onHoldItemSchema = new mongoose.Schema({
  uniqueCode: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  brand: {
    type: String,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  qrCodeUrl: {
    type: String,
  },
  isTaxable: {
    type: Boolean,
    default: false,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true });

const OnHoldItem = mongoose.model('OnHoldItem', onHoldItemSchema);

module.exports = OnHoldItem;
