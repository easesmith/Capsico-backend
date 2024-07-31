const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        code: {
            type: String,
            required: true,
            unique: true
        },

        expiry: {
            type: Date,
            required: true,
        },

        type: {
            type: String,
            required: true,
            enum: ["cart", "freebies", "free delivery"]
        },
        percentage: {
            type: Number,
            required: false,
        },

        amount: {
            type: Number,
            required: false
        },

        maxLimit: {
            type: Number,
            required: true,
            default: 0
        },
    },
    {
        timestamps: true,
    }
);


const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
