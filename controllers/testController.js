const express = require("express");
const router = express.Router();

const Restaurant = require("../models/restaurantModel");
const {
  Food,
  Variation,
  AddOn,
  Customization,
  CustomizationOption,
} = require("../models/productModel");
const Cuisine = require("../models/cuisineModel");
// const Food = require("../models/productModel");
const { Category, Menu } = require("../models/menuModel");
const upload = require("../middlewares/imgUpload");
const catchAsync = require("../utils/catchAsync");

exports.createFood = catchAsync(async (req, res, next) => {
  const {
    name,
    price,
    discountedPrice,
    veg,
    description,
    restaurantId,
    cuisine,
    preparationTime,
    availableTimings,
    categoryId, // New field
  } = req.body;
  const images = req.files;
  const paths = images ? images.map((image) => image.path) : [];
  console.log(req.body);
  if (
    !name ||
    !price ||
    !discountedPrice ||
    !description ||
    !restaurantId ||
    !cuisine ||
    !preparationTime ||
    !availableTimings ||
    !categoryId // Check for categoryId
  ) {
    return next(new AppError("All fields are required.", 400));
  }

  // Create new food item
  const newFood = await Food.create({
    name,
    images: paths,
    price,
    discountedPrice,
    veg,
    description,
    restaurantId,
    cuisine,
    preparationTime,
    availableTimings,
    categoryId, // Save categoryId in food item
  });

  // Update category with new food item
  await Category.findByIdAndUpdate(
    categoryId,
    { $push: { foodItems: newFood._id } },
    { new: true, useFindAndModify: false }
  );

  console.log(newFood);
  res.status(201).json({
    success: true,
    message: "Food item created successfully and category updated",
    food: newFood,
  });
});

exports.createVariation = catchAsync(async (req, res, next) => {
  const { name, price, discountedPrice, isDefault, inStock, foodId } = req.body;

  if (!name || !price || !foodId) {
    return next(new AppError("Name, price, and foodId are required.", 400));
  }

  const newVariation = await Variation.create({
    name,
    price,
    discountedPrice,
    isDefault,
    inStock,
    foodId,
  });

  // Add variation to food item
  await Food.findByIdAndUpdate(foodId, {
    $push: { variationIds: newVariation._id },
  });

  res.status(201).json({
    success: true,
    message: "Variation created successfully",
    variation: newVariation,
  });
});

exports.createAddOn = catchAsync(async (req, res, next) => {
  const { name, price, isDefault, inStock, foodId } = req.body;

  if (!name || !price || !foodId) {
    return next(new AppError("Name, price, and foodId are required.", 400));
  }

  const newAddOn = await AddOn.create({
    name,
    price,
    isDefault,
    inStock,
    foodId,
  });

  // Add add-on to food item
  await Food.findByIdAndUpdate(foodId, { $push: { addOnIds: newAddOn._id } });

  res.status(201).json({
    success: true,
    message: "Add-on created successfully",
    addOn: newAddOn,
  });
});

exports.createCustomization = catchAsync(async (req, res, next) => {
  const { name, type, required, foodId, options } = req.body;

  if (!name || !foodId || !options || options.length === 0) {
    return next(
      new AppError("Name, foodId, and at least one option are required.", 400)
    );
  }

  // Create customization options
  const createdOptions = await CustomizationOption.insertMany(options);

  const newCustomization = await Customization.create({
    name,
    type,
    required,
    foodId,
    options: createdOptions.map((option) => option._id),
  });

  // Add customization to food item
  await Food.findByIdAndUpdate(foodId, {
    $push: { customizationIds: newCustomization._id },
  });

  res.status(201).json({
    success: true,
    message: "Customization created successfully",
    customization: newCustomization,
  });
});

exports.createCustomizationOption = catchAsync(async (req, res, next) => {
  const { name, price, isDefault, customizationId } = req.body;

  if (!name || price === undefined || !customizationId) {
    return next(
      new AppError("Name, price, and customizationId are required.", 400)
    );
  }

  const newOption = await CustomizationOption.create({
    name,
    price,
    isDefault,
  });

  // Add option to customization
  await Customization.findByIdAndUpdate(customizationId, {
    $push: { options: newOption._id },
  });

  res.status(201).json({
    success: true,
    message: "Customization option created successfully",
    option: newOption,
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description, parentCategory, restaurantId } = req.body;

  if (!name || !restaurantId) {
    return next(new AppError("Name and restaurantId are required.", 400));
  }

  let level = 0;
  if (parentCategory) {
    const parent = await Category.findById(parentCategory);
    if (!parent) {
      return next(new AppError("Parent category not found.", 404));
    }
    level = parent.level + 1;
  }

  const newCategory = await Category.create({
    name,
    description,
    parentCategory,
    level,
    restaurantId,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    category: newCategory,
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const category = await Category.findByIdAndUpdate(
    id,
    {
      name,
      description,
      isActive,
    },
    { new: true, runValidators: true }
  );

  if (!category) {
    return next(new AppError("Category not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category,
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    return next(new AppError("Category not found.", 404));
  }

  // Check if category has subcategories
  const subcategories = await Category.find({ parentCategory: id });
  if (subcategories.length > 0) {
    return next(
      new AppError("Cannot delete category with subcategories.", 400)
    );
  }

  // Remove category from food items
  await Food.updateMany(
    { _id: { $in: category.foodItems } },
    { $pull: { categories: id } }
  );

  await Category.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

exports.getCategoryTree = catchAsync(async (req, res, next) => {
  const { restaurantId } = req.params;

  const categories = await Category.find({
    restaurantId,
    parentCategory: null,
  }).populate({
    path: "subcategories",
    populate: { path: "subcategories" },
  });

  res.status(200).json({
    success: true,
    categories,
  });
});

exports.createMenu = catchAsync(async (req, res, next) => {
  const { restaurantId, categories } = req.body;

  if (!restaurantId) {
    return next(new AppError("RestaurantId is required.", 400));
  }

  const newMenu = await Menu.create({
    restaurantId,
    categories,
  });

  res.status(201).json({
    success: true,
    message: "Menu created successfully",
    menu: newMenu,
  });
});

exports.updateMenu = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { categories } = req.body;

  const menu = await Menu.findByIdAndUpdate(
    id,
    {
      categories,
      lastUpdated: Date.now(),
    },
    { new: true, runValidators: true }
  );

  if (!menu) {
    return next(new AppError("Menu not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Menu updated successfully",
    menu,
  });
});

exports.getMenu = catchAsync(async (req, res, next) => {
  const { restaurantId } = req.params;

  const menu = await Menu.findOne({ restaurantId }).populate({
    path: "categories",
    populate: {
      path: "foodItems",
      model: "Food",
    },
  });

  if (!menu) {
    return next(new AppError("Menu not found.", 404));
  }

  res.status(200).json({
    success: true,
    menu,
  });
});
