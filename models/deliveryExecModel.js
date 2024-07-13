const mongoose = require("mongoose");

const deliveryExecSchema = new mongoose.Schema(
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

        type: {
            type: String,
            required: true,
            enum: ["veg", "non-veg", "both"]
        },

        address: {
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

        location: {
            lat: {
                type: Number,
                required: false,
            },
            lng: {
                type: Number,
                required: false,
            },
        }
    },
    {
        timestamps: true,
    }
);


const DeliveryExec = mongoose.model("DeliveryExec", deliveryExecSchema);
module.exports = DeliveryExec;
