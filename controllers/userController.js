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

    const { name, email, picture } = req.user._json;

    const user = await User.findOne({ email })
    console.log("db user", user);
    if (user) {
        user.email = email;
        user.name = name;
        user.image = picture;
    }
    else {
        await User.create({
            email,
            name,
            image: picture,
        })
    }
    res.status(200).json({
        success: true,
        message: "Login successful"
    })
})

exports.failureGoogleLogin = catchAsync(async (req, res, next) => {
    return next(new AppError("Error occured while login/signup through google", 500));
})

exports.successFacebookLogin = catchAsync(async (req, res, next) => {
    console.log("user", req.user);
    res.status(200).json({
        success: true,
        message: "Login successful"
    })
})

exports.failureFacebookLogin = catchAsync(async (req, res, next) => {
    return next(new AppError("Error occured while login/signup through facebook", 500));
})

exports.getAddresses = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const user = await User.findById(userId); // Retrieve only the addresses field for all users

    res.status(200).json({
        success: true,
        message: "All addresses",
        addresses: user.addresses
    });
})

exports.addAddress = catchAsync(async (req, res, next) => {
    const { lat, lng, state, city, pinCode, addressLine } = req.body;
    const userId = req.user._id;

    if (!userId || !state || !city || !pinCode || !lat || !lng || !addressLine) {
        return next(new AppError("All fields are required", 400));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    user.addresses.push(req.body);
    await user.save();

    res.status(200).json({ message: 'Address added successfully' });
})

exports.removeAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.query;
    const userId = req?.user?._id;

    // if (!userId || !addressId) {
    //     return next(new AppError("All fields are required", 400));
    // }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    const result = await User.updateOne(
        { _id: userId },
        { $pull: { addresses: { _id: addressId } } }
    );

    if (result.nModified === 0) {
        return next(new AppError("Address not found or already removed", 404));
    }

    res.status(200).json({ message: 'Address removed successfully' });
})