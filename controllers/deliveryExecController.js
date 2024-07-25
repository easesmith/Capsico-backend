const DeliveryExec = require("../models/deliveryExecModel");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcryptjs");

exports.deliveryExecSignup = catchAsync(async (req, res, next) => {
    const { email, password, phone, type, address, location } = req.body;

    // Check if the email or phone already exists
    const existingExec = await DeliveryExec.findOne({ $or: [{ email }, { phone }] });
    if (existingExec) {
        return next(new AppError('Email or phone already in use.', 400));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new delivery executive
    const newExec = await DeliveryExec.create({
        email,
        password: hashedPassword,
        phone,
        type,
        address,
        location
    });

    // Remove password from output
    newExec.password = undefined;

    res.status(201).json({
        success: true,
        deliveryExec: newExec
    });
});

exports.logout = catchAsync(async (req, res, next) => {
    res.clearCookie("token");
    res.clearCookie("connect.sid");

    res.status(200).json({
        success: true,
        message: "Logout successfully!",
    });
});