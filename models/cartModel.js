const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },

        products: [
            {
                productId: {
                    type: mongoose.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number
                }
            }
        ],

    },
    {
        timestamps: true,
    }
);


const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
