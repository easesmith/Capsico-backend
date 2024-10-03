const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    images: [
      {
        type: String,
        required: false,
      },
    ],

    price: {
      type: Number,
      required: true,
    },
    discountedPrice: {
      type: Number,
      required: true,
    },

    veg: {
      type: Boolean,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    restaurantId: {
      type: mongoose.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: true,
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
    availableTimings: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
      days: [
        {
          type: String,
          required: true,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Food", foodSchema);
module.exports = Product;
