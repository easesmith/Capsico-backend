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
            enum: ["capsico", "quickly", "both"]
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
            type: {
                type: String,
                enum: ['Point'],
                default: "Point"
            },
            coordinates: {
                type: [Number],
                required: true
            },
        },
    },
    {
        timestamps: true,
    }
);


deliveryExecSchema.index({ location: '2dsphere' });

const DeliveryExec = mongoose.model("DeliveryExec", deliveryExecSchema);
module.exports = DeliveryExec;
