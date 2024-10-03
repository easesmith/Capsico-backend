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
    images: [
      {
        type: String,
        required: false,
      },
    ],
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
      enum: ["veg", "non-veg", "both"],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    priceForOne: {
      type: Number,
      default: 0,
      required: true,
    },
    address: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
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
    cuisines: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cuisine" }],
    isSubscriptionActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Creating the 2dsphere index on the location field
restaurantSchema.index({ address: "2dsphere" });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
module.exports = Restaurant;
