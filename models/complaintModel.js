const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
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

        description: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);


const Complaint = mongoose.model("Complaint", complaintSchema);
module.exports = Complaint;
