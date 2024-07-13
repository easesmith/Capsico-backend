const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('../models/userModel');
const { verifyOtpSms } = require('../utils/sendSMS');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const createSendToken = (user, statusCode, res) => {
  let modifiedUser = { ...user.toObject() };
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  //   if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  console.log("user", modifiedUser);
  res.cookie('token', token, cookieOptions);
  res.cookie('user', JSON.stringify(modifiedUser), {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: false
  })

  res.status(statusCode).json({
    status: 'success',
    user
  });
};

//user routes
exports.userSignup = catchAsync(async (req, res, next) => {
  const { enteredOtp, phone } = req.body;

  await verifyOtpSms(phone, enteredOtp, res);

  const newUser = new User({
    phone
  });

  await newUser.save();

  res.status(201).json({
    success: true,
    message: "User successfully Created! Kindly Login..."
  })
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
