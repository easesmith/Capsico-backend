const DeliveryExec = require("../models/deliveryExecModel");
const Order = require("../models/orderModel");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcryptjs");
const { notifyDeliveryExec } = require("../utils/notification");

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


exports.assignOrderToDeliveryExec = catchAsync(async (req, res, next) => {
    const { orderId } = req.query;
    // Fetch the order by ID
    const order = await Order.findById(orderId);

    if (!order) {
        throw new Error("Order not found");
    }

    // Get the delivery address coordinates
    const { lat, lng } = order.address;

    // Find the nearest available delivery executive
    const deliveryExec = await DeliveryExec.findOne({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                $maxDistance: 10000 // 10 kilometers
            }
        },
    });

    if (!deliveryExec) {
        throw new Error("No delivery executive available");
    }

    // Assign the order to the delivery executive
    order.deliveryExecId = deliveryExec._id;
    await order.save();

    // Notify the delivery executive (implementation depends on your notification system)
    notifyDeliveryExec(deliveryExec._id, order._id);

    return order;
});