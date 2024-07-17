const Category = require("../models/categoryModel");
const Restaurant = require("../models/restaurantModel");
const catchAsync = require("../utils/catchAsync");

exports.getRestaurants = catchAsync(async (req, res, next) => {
    const restaurants = await Restaurant.find({});

    res.status(200).json({
        success: true,
        message: 'All restaurants',
        restaurants
    });
})


exports.searchRestaurants = catchAsync(async (req, res, next) => {
    const { search } = req.query;

    const restaurants = await Restaurant.aggregate([
        {
            $lookup: {
                from: "categories",
                localField: "categoryServes.categoryId",
                foreignField: "_id",
                as: "categories"
            }
        },
        {
            $match: {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { "categories.name": { $regex: search, $options: "i" } }
                ]
            }
        }
    ]);

    res.status(200).json({
        success: true,
        restaurants,
        message: "restaurants sent!",
    });
});


exports.addCategory = catchAsync(async (req, res, next) => {
    const { name } = req.body;
    const image = req.file;
    console.log("image", image);
    // Validate input
    if (!name || !image) {
        return next(new AppError('Name and image are required fields.', 400));
    }

    const newCategory = await Category.create({
        name,
        image: image.path
    });

    res.status(201).json({
        success: true,
        message: "Category created successfully",
    });
});

exports.getRestaurantByCategory = catchAsync(async (req, res, next) => {
    const { categoryId } = req.query;

    const restaurants = await Restaurant.find({
        "categoryServes.categoryId": categoryId
    })

    res.status(200).json({
        success: true,
        restaurants,
        message: `Restaurants serving category with ID '${categoryId}' retrieved successfully`
    });
});
