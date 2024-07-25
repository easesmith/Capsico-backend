const Cart = require("../models/cartModel");
const Favorite = require("../models/favoriteModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Restaurant = require("../models/restaurantModel");
const Review = require("../models/reviewModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { calculateDistance, calculateDeliveryTime } = require("../utils/distance");
const { sendOtpSms, sendOtpEmail } = require("../utils/sendSMS");

exports.getOTP = catchAsync(async (req, res, next) => {
    const { phone, email, isEmail } = req.query;

    if (!isEmail && !phone) {
        return next(new AppError("Phone is required", 400));
    }

    if (isEmail && !email) {
        return next(new AppError("Email is required", 400));
    }

    // const user = await User.findOne({ phone });
    // if (!user) {
    //     return next(new AppError("No User found", 404));
    // }
    if (isEmail) {
        await sendOtpEmail(email);
    }
    else {
        await sendOtpSms(phone);
    }

    res.status(200).json({
        success: true,
        message: "Otp sent successfully",
    });
});


exports.successGoogleLogin = catchAsync(async (req, res, next) => {

    const { name, email, picture } = req.user._json;

    const user = await User.findOne({ email })
    console.log("db user", user);
    if (user) {
        user.email = email;
        user.name = name;
        user.image = picture;
    }
    else {
        await User.create({
            email,
            name,
            image: picture,
        })
    }
    res.status(200).json({
        success: true,
        message: "Login successful"
    })
})

exports.failureGoogleLogin = catchAsync(async (req, res, next) => {
    return next(new AppError("Error occured while login/signup through google", 500));
})

exports.successFacebookLogin = catchAsync(async (req, res, next) => {
    console.log("user", req.user);
    res.status(200).json({
        success: true,
        message: "Login successful"
    })
})

exports.failureFacebookLogin = catchAsync(async (req, res, next) => {
    return next(new AppError("Error occured while login/signup through facebook", 500));
})

exports.getAddresses = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const user = await User.findById(userId);

    res.status(200).json({
        success: true,
        message: "All addresses",
        addresses: user.addresses
    });
})

exports.addAddress = catchAsync(async (req, res, next) => {
    const { lat, lng, state, city, pinCode, addressLine } = req.body;
    const userId = req.user._id;

    if (!userId || !state || !city || !pinCode || !lat || !lng || !addressLine) {
        return next(new AppError("All fields are required", 400));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    user.addresses.push(req.body);
    await user.save();

    res.status(200).json({ message: 'Address added successfully' });
})

exports.removeAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.query;
    const userId = req?.user?._id;

    // if (!userId || !addressId) {
    //     return next(new AppError("All fields are required", 400));
    // }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError("User not found", 404));
    }

    const result = await User.updateOne(
        { _id: userId },
        { $pull: { addresses: { _id: addressId } } }
    );

    if (result.nModified === 0) {
        return next(new AppError("Address not found or already removed", 404));
    }

    res.status(200).json({ message: 'Address removed successfully' });
})

exports.getRestaurantsNearUser = catchAsync(async (req, res, next) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return next(new AppError('Latitude and Longitude are required.', 400));
    }

    // Perform geospatial query to find nearby restaurants
    const restaurants = await Restaurant.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                distanceField: 'distance',
                spherical: true,
                maxDistance: 10000, // 10 kilometers
            }
        }
    ]);

    res.status(200).json({
        success: true,
        restaurants,
        message: 'Restaurants near user retrieved successfully'
    });
});

exports.getUserProfile = catchAsync(async (req, res, next) => {
    const userId = req?.user?._id;

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
        success: true,
        user,
    });
});

exports.updateUserProfile = catchAsync(async (req, res, next) => {
    const userId = req?.user?._id;
    const { name, gender } = req.body;
    const image = req?.file;

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('User not found.', 404));
    }

    user.name = name;
    user.gender = gender;
    if (image?.path) {
        user.image = image?.path;
    }

    await user.save();


    res.status(200).json({
        success: true,
        message: "Profile updated successfully"
    });
});


exports.getUserOrders = catchAsync(async (req, res, next) => {
    const userId = req?.user?._id;

    const orders = await Order.find({ userId });

    if (!orders) {
        return next(new AppError('No orders found for this user.', 404));
    }

    res.status(200).json({
        success: true,
        orders,
    });
});


exports.getUserFav = catchAsync(async (req, res, next) => {
    const userId = req?.user?._id;

    const favorites = await Favorite.find({ userId });

    if (!favorites) {
        return next(new AppError('No favorites found for this user.', 404));
    }

    res.status(200).json({
        success: true,
        favorites,
    });
});


exports.addToFav = catchAsync(async (req, res, next) => {
    const userId = req?.user?._id;
    const { restaurantId, productId } = req.body;

    if (!restaurantId || !productId) {
        return next(new AppError('All fields are required.', 400));
    }

    await Favorite.create({ userId, restaurantId, productId });

    res.status(200).json({
        success: true,
        message: "Added to Favorite"
    });
});

exports.removeFromFav = catchAsync(async (req, res, next) => {
    const userId = req?.user?._id;
    const { restaurantId, productId } = req.body;

    await Favorite.findOneAndDelete({ userId, productId, restaurantId });

    res.status(200).json({
        success: true,
        message: "Removed from Favorite"
    });
});


exports.addReview = catchAsync(async (req, res, next) => {
    const userId = req?.user?._id;
    const { reviewToId, reviewToType, rating, title, description } = req.body;
    let reviewTo = {};

    switch (reviewToType) {
        case "restaurant":
            reviewTo.restaurantId = reviewToId;
            break;

        case "order":
            reviewTo.orderId = reviewToId;
            break;

        case "deliveryExec":
            reviewTo.deliveryExecId = reviewToId;
            break;
        case "product":
            reviewTo.productId = reviewToId;
            break;
    }


    if (!title || !rating || !description || !reviewTo) {
        return next(new AppError('All fields are required.', 400));
    }

    await Review.create({
        title,
        description,
        rating,
        reviewBy: { type: "user", userId },
        reviewTo
    });

    res.status(200).json({
        success: true,
        message: "Review added successfully"
    });
});


exports.getUserReviews = catchAsync(async (req, res, next) => {
    const userId = req?.user?._id;

    const reviews = await Review.find({ reviewBy: { userId } });

    if (!reviews) {
        return next(new AppError('No reviews found for this user.', 404));
    }

    res.status(200).json({
        success: true,
        reviews,
    });
});


exports.changeVegMode = catchAsync(async (req, res, next) => {
    const userId = req?.user?._id;
    const { vegMode, vegModeType } = req.body;

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('User not found.', 404));
    }

    user.vegMode = vegMode;
    user.vegModeType = vegModeType;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Veg mode changed successfully",
    });
});


exports.getRestaurantByVegMode = catchAsync(async (req, res, next) => {
    const userId = req.user._id;

    const user = await User.findById(userId);

    const vegMode = user.vegMode;
    const vegModeType = user.vegModeType;
    let restaurants;

    if (vegMode) {
        if (vegModeType === "allRestaurants") {
            restaurants = await Restaurant.find({ restaurantType: "veg" });
        }
        else {
            restaurants = await Product.find({ veg: true });
        }
    }
    else {
        restaurants = await Restaurant.find();
    }

    res.status(200).json({
        success: true,
        message: 'Restaurant by vegMode retrieved successfully',
        data: restaurants
    });
});


exports.addToCartOrIncreaseQty = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
        cart = await Cart.create({
            userId,
            products: [{ productId, quantity: quantity || 1 }]
        });
    } else {
        const productIndex = cart.products.findIndex(p => p.productId.equals(productId));

        if (productIndex > -1) {
            cart.products[productIndex].quantity += quantity || 1;
        } else {
            cart.products.push({ productId, quantity: quantity || 1 });
        }

        await cart.save();
    }

    res.status(200).json({
        success: true,
        cart,
    });
});

exports.removeFromCartOrDecreaseQty = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return next(new AppError('Cart not found.', 404));
    }

    const productIndex = cart.products.findIndex(p => p.productId.equals(productId));

    if (productIndex === -1) {
        return next(new AppError('Product not found in cart.', 404));
    }

    if (cart.products[productIndex].quantity === 1) {
        cart.products = cart.products.filter(p => !p.productId.equals(productId));
    } else {
        cart.products[productIndex].quantity -= 1;
    }

    await cart.save();

    res.status(200).json({
        success: true,
        cart,
    });
});

// Remove all from cart
exports.clearCart = catchAsync(async (req, res, next) => {
    const userId = req.user._id;

    const cart = await Cart.findOneAndDelete({ userId });

    if (!cart) {
        return next(new AppError('Cart not found.', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Cart cleared.',
    });
});


exports.getCartDetails = catchAsync(async (req, res, next) => {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId }).populate('products.productId');

    if (!cart) {
        return next(new AppError('No cart found for this user.', 404));
    }

    res.status(200).json({
        success: true,
        cart,
    });
});


exports.placeOrder = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const { restaurantId, deliveryTime, cookingInstructions, tip, orderValue, address, discount } = req.body;

    // Find the user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return next(new AppError('Cart not found.', 404));
    }

    if (cart.products.length === 0) {
        return next(new AppError('No products in cart.', 400));
    }

    // Create a new order
    const order = new Order({
        userId,
        restaurantId,
        orderedTime: new Date(),
        deliveryTime,
        cookingInstructions,
        orderValue,
        discount,
        tip,
        address,
        products: cart.products // Including products from the cart in the order
    });

    // Save the order
    await order.save();

    // Clear the user's cart
    cart.products = [];
    await cart.save();

    res.status(201).json({
        success: true,
        order,
    });
});


exports.logout = catchAsync(async (req, res, next) => {
    // req.logout(function (err) {
    //     if (err) {
    //         return next(err);
    //     }

    //     // Destroy the session
    //     req.session.destroy(err => {
    //         if (err) {
    //             return res.status(500).send('Failed to logout');
    //         }

    //         // Clear cookies
    //         res.clearCookie('connect.sid'); // For session cookies
    //         res.clearCookie('token');   // For JWT or custom token cookies

    //         // Optionally, you might want to add a redirect or response message
    //         res.status(200).json({ message: 'Logout successful' });
    //     });
    // });
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return next(err);
            }

            // Clear session cookie
            res.clearCookie('connect.sid'); // Default session cookie name

            // Handle token-based logout
            // Clear JWT cookie (if applicable)
            res.clearCookie('token'); // Replace 'authToken' with your token cookie name

            // Send response
            res.status(200).json({ message: 'Logout successful' });
        });
    } else {
        // Handle token-based logout if no session exists
        res.clearCookie('token');
        res.clearCookie('connect.sid'); // Default session cookie name
        res.status(200).json({
            success: true,
            message: "Logout successfully!",
        });
    }
});


exports.searchRestaurantsAndDishes = catchAsync(async (req, res, next) => {
    const { search } = req.query;

    if (!search) {
        return next(new AppError("Please provide a search term", 400));
    }

    try {
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
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    phone: 1,
                    restaurantType: 1,
                    address: 1,
                    categoryServes: 1,
                    isSubscriptionActive: 1
                }
            }
        ]);

        const dishes = await Product.find({
            $or: [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ]
        }).populate('restaurantId', 'name');

        res.status(200).json({
            success: true,
            restaurants,
            dishes,
            message: "Restaurants and dishes retrieved successfully",
        });
    } catch (error) {
        return next(new AppError("Failed to retrieve data", 500));
    }
});


// exports.filterAndSortRestaurants = catchAsync(async (req, res, next) => {
//     const { rating, vegMode, sortBy, lat, lng } = req.query;

//     let restaurantMatch = {};
//     let sortCriteria = {};

//     // Filter Restaurants by veg mode
//     if (vegMode === 'pureVeg') {
//         restaurantMatch.restaurantType = 'veg';
//     }

//     // Determine sort criteria
//     switch (sortBy) {
//         case 'rating':
//             sortCriteria.averageRating = -1; // High to Low
//             break;
//         case 'deliveryTime':
//             sortCriteria.deliveryTime = 1; // Low to High
//             break;
//         case 'costLowToHigh':
//             sortCriteria.cost = 1; // Low to High
//             break;
//         case 'costHighToLow':
//             sortCriteria.cost = -1; // High to Low
//             break;
//         case 'distance':
//             // Ensure we sort by distance if coordinates are provided
//             if (lat && lng) {
//                 sortCriteria = { distance: 1 }; // Low to High distance
//             }
//             break;
//         default:
//             break;
//     }

//     // Aggregate restaurants with their average ratings and distance if applicable
//     const restaurants = await Restaurant.aggregate([
//         {
//             $match: restaurantMatch
//         },
//         {
//             $lookup: {
//                 from: 'reviews',
//                 localField: '_id',
//                 foreignField: 'reviewTo.restaurantId',
//                 as: 'reviews'
//             }
//         },
//         {
//             $addFields: {
//                 averageRating: { $avg: '$reviews.rating' }
//             }
//         },
//         {
//             $project: {
//                 name: 1,
//                 address: 1,
//                 averageRating: 1,
//                 deliveryTime: 1,
//                 cost: 1,
//                 distance: {
//                     $let: {
//                         vars: {
//                             coords: {
//                                 lat: parseFloat(lat),
//                                 lng: parseFloat(lng)
//                             }
//                         },
//                         in: {
//                             $geoNear: {
//                                 $geometry: {
//                                     type: "Point",
//                                     coordinates: ["$$coords.lng", "$$coords.lat"]
//                                 },
//                                 $maxDistance: 1000000, // Use a large enough distance to include all
//                                 distanceField: "distance",
//                                 spherical: true
//                             }
//                         }
//                     }
//                 }
//             }
//         },
//         {
//             $match: rating ? { averageRating: { $gte: parseFloat(rating) } } : {}
//         },
//         {
//             $sort: sortCriteria
//         }
//     ]);

//     if (!restaurants.length) {
//         return next(new AppError('No restaurants found matching the criteria.', 404));
//     }

//     res.status(200).json({
//         success: true,
//         restaurants,
//     });
// });


exports.filterAndSortRestaurants = catchAsync(async (req, res, next) => {
    const { rating, vegMode, sortBy, lat, lng, maxDistance } = req.query;

    // Build the match stage for filtering
    const matchStage = {};
    let pipeline = [];

    if (rating) {
        // matchStage.rating = { $gte: parseInt(3) };
        pipeline.push(
            {
                $lookup: {
                    from: 'reviews', // Collection name
                    localField: '_id',
                    foreignField: 'reviewTo.restaurantId',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    averageRating: { $avg: '$reviews.rating' }
                }
            },
            {
                $match: { averageRating: { $gte: parseFloat(rating) } }
            }
        );
    }


    if (vegMode === 'pureVeg') {
        matchStage.restaurantType = 'veg';
    }

    console.log("matchstage", matchStage);

    // Create aggregation pipeline

    // Geospatial Query Stage
    if (lat && lng && sortBy === "distance") {
        pipeline.push({
            $geoNear: {
                near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                distanceField: 'distance',
                maxDistance: parseInt(maxDistance || 1) * 1000, // Convert km to meters
                spherical: true
            }
        });
    }

    // Match Stage
    if (Object.keys(matchStage).length) {
        pipeline.push({ $match: matchStage });
    }

    // Sort Stage
    let sortStage = {};
    switch (sortBy) {
        case 'rating':
            sortStage.rating = -1; // High to Low
            break;
        // case 'costLowToHigh':
        //     sortStage.cost = 1; // Low to High
        //     break;
        // case 'costHighToLow':
        //     sortStage.cost = -1; // High to Low
        //     break;
        case 'distance':
            sortStage.distance = 1; // Low to High distance
            break;
        default:
            break;
    }
    if (Object.keys(sortStage).length) {
        pipeline.push({ $sort: sortStage });
    }

    console.log("pipeline", pipeline);
    // Execute Aggregation
    let restaurants = await Restaurant.aggregate(pipeline);

    console.log("restaurants", restaurants);
    // Calculate delivery time based on distance
    restaurants = restaurants.map(restaurant => {
        const distance = calculateDistance(lat, lng, restaurant.address.coordinates[1], restaurant.address.coordinates[0]);
        restaurant.deliveryTime = calculateDeliveryTime(distance);
        return restaurant;
    });

    // Sort by delivery time if requested
    if (sortBy === 'deliveryTime') {
        restaurants.sort((a, b) => a.deliveryTime - b.deliveryTime);
    }

    if (!restaurants.length) {
        return next(new AppError('No restaurants found matching the criteria.', 404));
    }

    res.status(200).json({
        success: true,
        restaurants,
        length: restaurants.length
    });
});