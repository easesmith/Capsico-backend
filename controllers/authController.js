const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('../models/userModel');
const { verifyOtpSms, verifyOtpEmail } = require('../utils/sendSMS');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  // Uncomment the following line in production
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    user: user.toObject(), // Convert user to a plain object
  });
};

//user routes
exports.userSignup = catchAsync(async (req, res, next) => {
  const { enteredOtp, phone, email, isEmail } = req.body;

  console.log("body", req.body);

  // Verify OTP

  if (isEmail) {
    await verifyOtpEmail(email, enteredOtp);
  }
  else {
    await verifyOtpSms(phone, enteredOtp);
  }

  // Check if the user already exists
  let user = await User.find({
    $or: [
      { phone },
      { email }
    ]
  });
  console.log("user", user);
  if (user) {
    // If yes, update user
    if (isEmail) {
      user.email = email;
    }
    else {
      user.phone = phone;
    }
    await user.save();
  }

  if (!user) {
    // If not, create a new user
    user = new User({ phone, email });
    await user.save();
  }

  // Send token
  createSendToken(user, user.isNew ? 201 : 200, res);
});


exports.authenicateUser = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  const token = req.cookies["token"];

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});
