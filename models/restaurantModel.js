const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },

        password: {
            type: String,
            required: [true, "Please provide a password"],
            minlength: 8,
            select: false,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
        },

        restaurantType: {
            type: String,
            required: true,
            enum: ["veg", "non-veg", "both"]
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

        categoryServes: [
            {
                categoryId: {
                    type: mongoose.Types.ObjectId,
                    ref: "Category",
                    required: true,
                },
                discountPercent: {
                    type: String
                }
            }
        ],
        isSubscriptionActive: {
            type: Boolean
        }
    },
    {
        timestamps: true,
    }
);


const Restaurant = mongoose.model("Restaurant", restaurantSchema);
module.exports = Restaurant;
