const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { sendOtpSms, sendOtpEmail } = require("../utils/sendSMS");

exports.getOTP = catchAsync(async (req, res, next) => {
    const { phone, email, isEmail } = req.query;

    if (!isEmail && !phone) {
        return next(new AppError("Phone is required", 400));
    }

    if (isEmail && !email) {
        return next(new AppError("Email is required", 400));
    }

    // const user = await User.findOne({ phone });
    // if (!user) {
    //     return next(new AppError("No User found", 404));
    // }
    if (isEmail) {
        await sendOtpEmail(email);
    }
    else {
        await sendOtpSms(phone);
    }

    res.status(200).json({
        success: true,
        message: "Otp sent successfully",
    });
});


exports.successGoogleLogin = catchAsync(async (req, res, next) => {
    console.log("user", req.user);
})

exports.failureGoogleLogin = catchAsync(async (req, res, next) => {
    return next(new AppError("Error occured while login/Signup", 500));
})