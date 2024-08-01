const DeliveryExec = require("../models/deliveryExecModel");
const Order = require("../models/orderModel");
const catchAsync = require("../utils/catchAsync");
const bcrypt = require("bcryptjs");
const { notifyDeliveryExec } = require("../utils/notification");
const AssignedOrders = require("../models/assignedOrdersModel");
const AppError = require("../utils/appError");

exports.deliveryExecSignup = catchAsync(async (req, res, next) => {
    const { email, password, phone, type, address, coordinates } = req.body;

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
        location: {
            type: 'Point',
            coordinates
        }
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

    if (!orderId) {
        return next(new AppError('OrderId is required.', 400));
    }

    const order = await Order.findById(orderId);

    if (!order) {
        return next(new AppError('Order not found', 404));
    }
    const { lat, lng } = order.address;
    console.log("Order",order.address);

    const deliveryExec = await DeliveryExec.findOne({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                $maxDistance: 5000 // 5 kilometers
            }
        },
    });

    if (!deliveryExec) {
        return next(new AppError('No delivery executive available in your area.', 503));
    }

    const assignedOrder = await AssignedOrders.create({
        userId: order.userId,
        orderId: order._id,
        restaurantId: order.restaurantId,
        deliveryExecId: deliveryExec._id,
        address: order.address
    });

    notifyDeliveryExec(deliveryExec._id, order._id);

    res.status(200).json({
        success: true,
        message: "Order assigned to delivery executive successfully!",
        assignedOrder,
    });
});

exports.getassignedOrderOfDeliveryExec = catchAsync(async (req, res, next) => {
    const { deliveryExecId } = req.query;

    if (!deliveryExecId) {
        return next(new AppError('DeliveryExecId is required.', 400));
    }

    // Fetch the order by ID
    const assignedOrders = await AssignedOrders.find({ deliveryExecId });

    if (!assignedOrders) {
        return next(new AppError('Assigned orders not found', 404));
    }

    res.status(200).json({
        success: true,
        message: "Assigned orders retrived successfully!",
        assignedOrders
    })
});

exports.acceptOrder = catchAsync(async (req, res, next) => {
    const { assignedOrderId } = req.query;

    if (!assignedOrderId) {
        return next(new AppError('AssignedOrderId is required.', 400));
    }

    const assignedOrder = await AssignedOrders.findByIdAndUpdate(
        assignedOrderId,
        { status: "accepted" },
        { new: true }
    );

    if (!assignedOrder) {
        return next(new AppError('Assigned order not found', 404));
    }

    res.status(200).json({
        success: true,
        message: "Order accepted successfully!",
    });
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
    const { assignedOrderId } = req.query;
    const { cancellationReason } = req.body;

    if (!assignedOrderId || !cancellationReason) {
        return next(new AppError('AssignedOrderId and cancellationReason are required.', 400));
    }

    const assignedOrder = await AssignedOrders.findByIdAndUpdate(
        assignedOrderId,
        {
            status: "cancelled",
            cancellationReason,
            canceledBy: "deliveryExec",
        },
        { new: true }
    );

    if (!assignedOrder) {
        return next(new AppError('Assigned order not found', 404));
    }

    res.status(200).json({
        success: true,
        message: "Order cancelled successfully!",
    });
});


exports.completeOrder = catchAsync(async (req, res, next) => {
    const { assignedOrderId } = req.query;

    if (!assignedOrderId) {
        return next(new AppError('AssignedOrderId is required.', 400));
    }

    const assignedOrder = await AssignedOrders.findOneAndUpdate(
        { _id: assignedOrderId },
        { status: "delivered" },
        { new: true }
    );

    if (!assignedOrder) {
        throw new Error("Assigned order not found or already completed/cancelled");
    }

    // Update the order status to 'delivered'
    const order = await Order.findByIdAndUpdate(
        assignedOrder.orderId,
        { status: "delivered" },
        { new: true }
    );

    if (!order) {
        return next(new AppError('Order not found or already completed/cancelled', 404));
    }

    res.status(200).json({
        success: true,
        message: "Order completed successfully!",
    });
});


exports.updateOrderLocation = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;
    const { lat, lng } = req.body;

    if (!orderId || lat === undefined || lng === undefined) {
        return next(new AppError('OrderId, latitude, and longitude are required.', 400));
    }

    const order = await Order.findById(orderId);

    if (!order) {
        return next(new AppError('No order found with this id.', 404));
    }

    order.address.lat = lat;
    order.address.lng = lng;
    await order.save();

    res.status(200).json({
        success: true,
        message: 'Order location updated successfully!',
    });
});
