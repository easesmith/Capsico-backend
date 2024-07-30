const { default: mongoose } = require("mongoose");
const Category = require("../models/categoryModel");
const Restaurant = require("../models/restaurantModel");
const catchAsync = require("../utils/catchAsync");
const Coupon = require("../models/couponModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const AppError = require("../utils/appError");
const bcrypt = require("bcryptjs");
const Review = require("../models/reviewModel");
const Order = require("../models/orderModel");


exports.addRestaurant = catchAsync(async (req, res, next) => {
    const { name, email, password, phone, restaurantType, lat, lng, addressLine, city, state, pinCode, categoryServes, isSubscriptionActive } = req.body;
    const images = req.files;
    const paths = images.map((image) => image.path);

    if (!name || !email || !password || !phone || !restaurantType || !addressLine || !city || !state || !pinCode || !lat || !lng) {
        return next(new AppError('All fields are required.', 400));
    }

    if (categoryServes && categoryServes.length > 0) {
        for (let category of categoryServes) {
            if (!mongoose.Types.ObjectId.isValid(category.categoryId)) {
                return next(new AppError('Invalid category ID.', 400));
            }
            const categoryExists = await Category.findById(category.categoryId);
            if (!categoryExists) {
                return next(new AppError(`Category with ID ${category.categoryId} not found.`, 404));
            }
        }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newRestaurant = new Restaurant({
        name,
        phone,
        email,
        images: paths,
        password: passwordHash,
        address: {
            type: 'Point',
            coordinates: [lng, lat],
            addressLine,
            city,
            state,
            pinCode
        },
        restaurantType,
        categoryServes,
        isSubscriptionActive
    });

    await newRestaurant.save();

    res.status(200).json({
        success: true,
        message: 'Restaurant added successfully',
    });
})


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
    const images = req.files;
    const paths = images.map((image) => image.path);
    console.log("images", images);

    // Validate input
    if (!name || !images) {
        return next(new AppError('Name and image are required fields.', 400));
    }

    const newCategory = await Category.create({
        name,
        images: paths
    });

    res.status(201).json({
        success: true,
        message: "Category created successfully",
    });
});

exports.getCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.find();

    res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        categories
    });
});

exports.getRestaurantByCategory = catchAsync(async (req, res, next) => {
    const { categoryId } = req.query;

    if (!categoryId) {
        return next(new AppError('CategoryId is required field.', 400));
    }

    const restaurants = await Restaurant.find({
        "categoryServes.categoryId": categoryId
    })

    res.status(200).json({
        success: true,
        restaurants,
        message: `Restaurants serving category with ID '${categoryId}' retrieved successfully`
    });
});


exports.updateRestaurant = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, email, phone, restaurantType, lat, lng, addressLine, city, state, pinCode, categoryServes, isSubscriptionActive } = req.body;
    const images = req.files;
    let paths;

    if (images && images.length > 0) {
        paths = images.map((image) => image.path);
    }

    // Validate required fields
    if (!name || !email || !phone || !restaurantType || !addressLine || !city || !state || !pinCode || !lat || !lng) {
        return next(new AppError('All fields are required.', 400));
    }
    if (categoryServes && categoryServes.length > 0) {
        for (let category of categoryServes) {
            if (!mongoose.Types.ObjectId.isValid(category.categoryId)) {
                return next(new AppError('Invalid category ID.', 400));
            }
            const categoryExists = await Category.findById(category.categoryId);
            if (!categoryExists) {
                return next(new AppError(`Category with ID ${category.categoryId} not found.`, 404));
            }
        }
    }

    // Find the restaurant by ID
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
        return next(new AppError('Restaurant not found.', 404));
    }

    // Update restaurant details
    if (paths) {
        restaurant.images = paths;
    }

    restaurant.name = name;
    restaurant.email = email;
    restaurant.phone = phone;
    restaurant.restaurantType = restaurantType;
    restaurant.address = {
        type: 'Point',
        coordinates: [lng, lat],
        addressLine,
        city,
        state,
        pinCode
    };
    restaurant.categoryServes = categoryServes;
    restaurant.isSubscriptionActive = isSubscriptionActive;

    // Save updated restaurant
    await restaurant.save();

    res.status(200).json({
        success: true,
        message: 'Restaurant updated successfully',
        restaurant
    });
});

exports.deleteRestaurant = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const restaurant = await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
        return next(new AppError('Restaurant not found.', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Restaurant deleted successfully',
    });
});

exports.addCoupon = catchAsync(async (req, res, next) => {
    const { name, code, expiry, type } = req.body;

    if (!name || !code || !expiry || !type) {
        return next(new AppError('All fields are required.', 400));
    }

    const newCoupon = await Coupon.create({
        name,
        code: code.toUpperCase(),
        expiry,
        type
    });

    res.status(201).json({
        success: true,
        message: 'Coupon added successfully',
        coupon: newCoupon
    });
});


exports.updateCoupon = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, code, expiry, type } = req.body;

    // Validate the type if it's present in the request
    if (type && !["cart", "freebies", "free delivery"].includes(type)) {
        return next(new AppError('Invalid coupon type.', 400));
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
        id,
        {
            name,
            code: code.toUpperCase(),
            expiry,
            type
        },
        { new: true, runValidators: true }
    );

    if (!updatedCoupon) {
        return next(new AppError('Coupon not found.', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Coupon updated successfully',
        coupon: updatedCoupon
    });
});

exports.deleteCoupon = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
        return next(new AppError('Coupon not found.', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Coupon deleted successfully'
    });
});


exports.getCoupons = catchAsync(async (req, res, next) => {
    const coupons = await Coupon.find();

    res.status(200).json({
        success: true,
        message: 'Coupons retrieved successfully',
        coupons
    });
});


exports.getCouponDetails = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
        return next(new AppError('Coupon not found.', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Coupon details retrieved successfully',
        coupon
    });
});

exports.addProduct = catchAsync(async (req, res, next) => {
    const { name, price, discountedPrice, veg, description, restaurantId, categoryId, start, end, days } = req.body;
    const images = req.files;
    const paths = images.map((image) => image.path);

    if (!name || !price || !discountedPrice || !description || !restaurantId || !categoryId || !start || !end) {
        return next(new AppError('All fields are required.', 400));
    }

    const newProduct = await Product.create({
        name,
        images: paths,
        price,
        discountedPrice,
        veg,
        description,
        restaurantId,
        categoryId,
        availableTimings: {
            start,
            end,
            days
        }
    });

    res.status(201).json({
        success: true,
        message: 'Product added successfully',
        product: newProduct
    });
});


exports.updateProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;
    const images = req.files;
    let paths;

    if (images && images.length > 0) {
        paths = images.map((image) => image.path);
    }

    // Construct the update object
    const updateData = { ...updates };
    if (paths) {
        updateData.images = paths;
    }

    // Use findByIdAndUpdate with the constructed update object
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
    });

    if (!updatedProduct) {
        return next(new AppError('Product not found.', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        product: updatedProduct,
    });
});


exports.deleteProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
        return next(new AppError('Product not found.', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
    });
});

exports.getProductsByRestaurantId = catchAsync(async (req, res, next) => {
    const { restaurantId } = req.params;

    if (!restaurantId) {
        return next(new AppError('Restaurant ID is required.', 400));
    }

    const products = await Product.find({ restaurantId });

    if (!products.length) {
        return next(new AppError('No products found for this restaurant.', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Products retrieved successfully',
        products
    });
});


exports.getRestaurantReviews = catchAsync(async (req, res, next) => {
    const restaurantId = req?.restaurant?._id;

    const reviews = await Review.find({ 'reviewTo.restaurantId': restaurantId });

    if (!reviews) {
        return next(new AppError('No reviews found for this restaurant.', 404));
    }

    res.status(200).json({
        success: true,
        reviews,
    });
});

exports.getProductReviews = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    console.log("productId", productId);

    const reviews = await Review.find({ 'reviewTo.productId': productId });

    if (!reviews.length) {
        return next(new AppError('No reviews found for this product.', 404));
    }

    res.status(200).json({
        success: true,
        reviews,
    });
});



exports.addReview = catchAsync(async (req, res, next) => {
    const restaurantId = req?.restaurant?._id;
    const { deliveryExecId, rating, title, description } = req.body;


    if (!title || !rating || !description || !deliveryExecId) {
        return next(new AppError('All fields are required.', 400));
    }

    await Review.create({
        title,
        description,
        rating,
        reviewBy: { restaurantId },
        reviewTo: { deliveryExecId }
    });

    res.status(200).json({
        success: true,
        message: "Review added successfully"
    });
});

exports.getRestaurantDetails = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
        return next(new AppError('No restaurant found with that ID', 404));
    }

    res.status(200).json({
        success: true,
        restaurant,
    });
});


exports.getProductDetails = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    res.status(200).json({
        success: true,
        product,
    });
});


exports.logout = catchAsync(async (req, res, next) => {
    res.clearCookie("token");
    res.clearCookie("connect.sid");

    res.status(200).json({
        success: true,
        message: "Logout successfully!",
    });
});


exports.acceptOrder = catchAsync(async (req, res, next) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    order.status = "preparing";
    await order.save();

    res.status(200).json({
        success: true,
        message: "Order accepted successfully!",
    });
});
