const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
        
        restaurantId: {
            type: mongoose.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        orderedTime: {
            type: Date,
            required: true,
        },

        deliveryTime: {
            type: Date,
            required: true,
        },

        cookingInstructions: {
            type: String,
        },

        favorite: {
            type: Boolean,
        },

        status: {
            type: Boolean,
        },

        tip: {
            type: Number,
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


const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
