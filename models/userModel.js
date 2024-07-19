const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },

    phone: {
      type: Number,
      required: false,
      unique: true,
    },

    email: {
      type: String,
      required: false,
      // unique: true,
    },

    gender: {
      type: String,
      required: false,
    },

    referralCode: {
      type: String,
    },

    image: {
      type: String,
      required: false,
    },

    vegMode: {
      type: Boolean,
      default:false
    },

    vegModeType: {
      type: String,
    },

    isCodAvailable: {
      type: Boolean,
    },

    addresses: [
      {
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
      }
    ],
  },
  {
    timestamps: true,
  }
);


const User = mongoose.model("User", userSchema);
module.exports = User;
