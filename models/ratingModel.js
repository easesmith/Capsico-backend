const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    ratingType: {
      type: String,
      enum: ["restaurant", "deliveryAgent", "food"],
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: function () {
        return this.ratingType === "restaurant";
      },
    },
    deliveryAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAgent",
      required: function () {
        return this.ratingType === "deliveryAgent";
      },
    },
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: function () {
        return this.ratingType === "food";
      },
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    description: {
      type: String,
      maxlength: 500,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can only rate once per item per order
ratingSchema.index(
  { user: 1, order: 1, ratingType: 1, restaurant: 1 },
  { unique: true, sparse: true }
);
ratingSchema.index(
  { user: 1, order: 1, ratingType: 1, deliveryAgent: 1 },
  { unique: true, sparse: true }
);
ratingSchema.index(
  { user: 1, order: 1, ratingType: 1, food: 1 },
  { unique: true, sparse: true }
);

const Rating = mongoose.model("Rating", ratingSchema);

module.exports = Rating;
