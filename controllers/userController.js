const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { sendOtpSms } = require("../utils/sendSMS");

exports.getOTP = catchAsync(async (req, res, next) => {
    const { phone } = req.query;

    if (!phone) {
        return next(new AppError("Phone is required", 400));
    }

    // const user = await User.findOne({ phone });
    // if (!user) {
    //     return next(new AppError("No User found", 404));
    // }

    await sendOtpSms(phone);

    res.status(200).json({
        success: true,
        message: "Otp sent successfullys",
    });
});