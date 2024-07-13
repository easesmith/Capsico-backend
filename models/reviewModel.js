const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        reviewTo: {
            type: String,
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

            deliveryExecId: {
                type: mongoose.Types.ObjectId,
                ref: "DeliveryExec",
                required: false,
            },

            productId: {
                type: mongoose.Types.ObjectId,
                ref: "Product",
                required: false,
            },
        },

        reviewBy: {
            type: String,
            userId: {
                type: mongoose.Types.ObjectId,
                ref: "User",
                required: false,
            },

            restaurantId: {
                type: mongoose.Types.ObjectId,
                ref: "Restaurant",
                required: false,
            },
        },

        rating: {
            type: Number,
            required: true,
        },

        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);


const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
