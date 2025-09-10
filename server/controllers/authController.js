const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  const userExists = await User.findOne({ username });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    username,
    password,
    role,
    isApproved: role === 'employee' ? true : false, // Auto-approve employees on registration
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  // Check if the provided credentials match the special employee credentials from environment variables
  const isSpecialEmployee =
    process.env.EMP1_EMAIL === username &&
    process.env.EMP1_PASS === password;

  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    // If it's not a special employee, check if the user is approved
    if (!isSpecialEmployee && !user.isApproved) {
      return res.status(401).json({ message: 'User not approved' });
    }
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

// @desc    Approve or disapprove user (Admin only)
// @route   PUT /api/auth/users/:id/approve
// @access  Private/Admin
const approveUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.isApproved = req.body.isApproved;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      role: updatedUser.role,
      isApproved: updatedUser.isApproved,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = { registerUser, loginUser, getUsers, approveUser };
