const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
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
            type: {
                type: String,
                enum: ['Point'],
                required: true,
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: true,
            },
            addressLine: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            state: {
                type: String,
                required: true,
            },
            pinCode: {
                type: String,
                required: true,
            },
        },
        categoryServes: [
            {
                categoryId: {
                    type: mongoose.Types.ObjectId,
                    ref: "Category",
                    required: false,
                },
                discountPercent: {
                    type: String
                }
            }
        ],
        isSubscriptionActive: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

// Creating the 2dsphere index on the location field
restaurantSchema.index({ address: '2dsphere' });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
module.exports = Restaurant;
