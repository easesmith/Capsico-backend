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

        status: {
            type: String,
            enum: ["assigned", "accepted", "cancelled", "delivered"],
            default: "assigned",
        },
        cancelReason: {
            type: String,
        },
        cancelledBy: {
            type: String,
            enum: ["deliveryExec", "user", "restaurant"],
        },
    },
    {
        timestamps: true,
    }
);


const AssignedOrders = mongoose.model("AssignedOrders", assignedOrdersSchema);
module.exports = AssignedOrders;
