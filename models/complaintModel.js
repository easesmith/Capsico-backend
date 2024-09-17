const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: false,
        },

        deliveryExecId: {
            type: mongoose.Types.ObjectId,
            ref: "DeliveryExec",
            required: false,
        },

        restaurantId: {
            type: mongoose.Types.ObjectId,
            ref: "Restaurant",
            required: false,
        },

        orderId: {
            type: mongoose.Types.ObjectId,
            ref: "Order",
            required: false,
        },

        description: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            required: true,
            enum: ["Pending", "Resolved", "Rejected"],
            default: "Pending",
        },

        resolution: {
            type: String,
            required: false,
            default:""
        },

        type: {
            type: String,
            required: true,
            enum: [
                "user-delivery",
                "user-restaurant",
                "user-app",
                "delivery-restaurant",
                "restaurant-user",
                "restaurant-delivery",
            ]
        },

    },
    {
        timestamps: true,
    }
);


const Complaint = mongoose.model("Complaint", complaintSchema);
module.exports = Complaint;
