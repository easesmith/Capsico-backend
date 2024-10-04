const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pinCode: {
      type: String,
      required: true,
    },
    addressLine: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

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
      default: false,
    },

    vegModeType: {
      type: String,
    },

    isCodAvailable: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
const Address = mongoose.model("Address", addressSchema);

module.exports = { User, Address };
