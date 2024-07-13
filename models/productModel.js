const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        image: {
            type: String,
            required: true,
        },

        price: {
            type: Number,
            required: true,
        },
        discountedPrice: {
            type: Number,
            required: true,
        },

        veg: {
            type: Boolean,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        restaurantId: {
            type: mongoose.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },

        categoryId: {
            type: mongoose.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        availableTimings: {
            start: {
                type: Date,
                required: true,
            },
            end: {
                type: Date,
                required: true,
            },
            days: [
                {
                    type: String,
                    required: true,
                }
            ]
        },
    },
    {
        timestamps: true,
    }
);


const Product = mongoose.model("Product", productSchema);
module.exports = Product;
