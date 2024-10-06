const mongoose = require("mongoose");
const variationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discountedPrice: Number,
    isDefault: {
      type: Boolean,
      default: false,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const addOnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const customizationOptionSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    isDefault: Boolean,
  },
  {
    timestamps: true,
  }
);

const customizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["single", "multiple"],
      default: "single",
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomizationOption",
        required: true,
      },
    ],
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discountedPrice: {
      type: Number,
      required: true,
    },
    images: [
      {
        type: String,
        required: false,
      },
    ],
    veg: {
      type: Boolean,
      required: true,
    },
    restaurantId: {
      type: mongoose.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    cuisine: {
      type: mongoose.Types.ObjectId,
      ref: "Cuisine",
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
    preparationTime: {
      type: Number,
      required: true,
    }, // in minutes
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
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    variationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variation",
      },
    ],
    addOnIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AddOn",
      },
    ],
    customizationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customization",
      },
    ],
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const AddOn = mongoose.model("AddOn", addOnSchema);
const Variation = mongoose.model("Variation", variationSchema);
const Customization = mongoose.model("Customization", customizationSchema);
const Food = mongoose.model("Food", foodSchema);
const CustomizationOption = mongoose.model(
  "CustomizationOption",
  customizationOptionSchema
);

module.exports = { Food, Variation, AddOn, Customization, CustomizationOption };
