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
        },

        expiry: {
            type: Date,
            required: true,
        },

        type: {
            type: Date,
            required: true,
            enum: ["cart", "freebies", "free delivery"]
        },
    },
    {
        timestamps: true,
    }
);


const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
