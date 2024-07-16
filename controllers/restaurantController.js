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