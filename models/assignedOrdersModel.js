const mongoose = require("mongoose");

const assignedOrdersSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        deliveryExecId: {
            type: mongoose.Types.ObjectId,
            ref: "DeliveryExec",
            required: true,
        },

        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },

        orderId: {
            type: mongoose.Types.ObjectId,
            ref: "Order",
            required: true,
        },

        address: {
            lat: {
                type: Number,
                required: false,
            },
            lng: {
                type: Number,
                required: false,
            },
            state: {
                type: String,
                required: false,
            },
            city: {
                type: String,
                required: false,
            },
            pinCode: {
                type: String,
                required: false,
            },
            addressLine: {
                type: String,
            },
        },
    },
    {
        timestamps: true,
    }
);


const AssignedOrders = mongoose.model("AssignedOrders", assignedOrdersSchema);
module.exports = AssignedOrders;
