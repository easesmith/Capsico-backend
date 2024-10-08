const AssignedOrders = require("../models/assignedOrdersModel");
const Cart = require("../models/cartModel");
const Complaint = require("../models/complaintModel");
const Coupon = require("../models/couponModel");
const Favorite = require("../models/favoriteModel");
const Order = require("../models/orderModel");
const Content = require("../models/content");
const { Food } = require("../models/productModel");
const Restaurant = require("../models/restaurantModel");
const Review = require("../models/reviewModel");
const { User, Address } = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Cuisine = require("../models/cuisineModel");
const { Category, Menu } = require("../models/menuModel");

const mongoose = require("mongoose");

const {
  calculateDistance,
  calculateDeliveryTime,
} = require("../utils/distance");
const { sendOtpSms, sendOtpEmail } = require("../utils/sendSMS");

const jwt = require("jsonwebtoken");

// const { generateOTP, sendOTP } = require("../utils/otpUtils");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES_IN = "24h";

// Step 1: Initiate login/signup process
exports.postLogin = catchAsync(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  // Generate OTP
  // const otp = generateOTP();
  // const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

  // // Save OTP to UserOtpLink
  // await UserOtpLink.findOneAndUpdate(
  //   { phone },
  //   {
  //     phone,
  //     otp,
  //     otpExpiresAt,
  //   },
  //   { upsert: true, new: true }
  // );

  // // Send OTP to user's phone
  // await sendOTP(phone, otp);

  res.status(200).json({ message: "OTP sent successfully" });
});

// Step 2: Verify OTP and complete login
exports.postVerifyOTP = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res
      .status(400)
      .json({ message: "Phone number and OTP are required" });
  }

  //   // Find the OTP link
  //   const otpLink = await UserOtpLink.findOne({
  //     phone,
  //     otp,
  //     otpExpiresAt: { $gt: new Date() },
  //   });

  //   if (!otpLink) {
  //     return res.status(401).json({ message: "Invalid or expired OTP" });
  //   }

  // Find or create user
  let user = await User.findOne({ phone });
  if (!user) {
    user = new User({ phone });
    await user.save();
  }

  //   // Delete the used OTP link
  //   await UserOtpLink.findByIdAndDelete(otpLink._id);

  //   // Create JWT token
  //   const token = jwt.sign({ userId: user._id, phone: user.phone }, JWT_SECRET, {
  //     expiresIn: JWT_EXPIRES_IN,
  //   });

  // Send response
  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      // Add other user fields as needed
    },
  });
});

exports.getHompageBanner = catchAsync(async (req, res) => {
  // Fetch all active banner contents for the customer app
  const banners = await Content.find({
    type: "banner",
    section: "home", // Assuming 'home' is the section for homepage banners
    contentside: "capsico-app", // Specifically for the customer app
    active: true, // Only fetch active banners
  }).sort({ createdAt: -1 }); // Sort by creation date, newest first

  if (banners.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No active banners found",
    });
  }

  res.json({
    success: true,
    count: banners.length,
    data: banners.map((banner) => ({
      title: banner.title,
      description: banner.description,
      value: banner.value, // This could be used for imageUrl
      type: banner.type,
      section: banner.section,
    })),
  });
});

exports.postRating = catchAsync(async (req, res) => {
  const { ratingType, itemId, rating, description, orderId } = req.body;

  if (!ratingType || !itemId || !rating || !orderId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  const ratingData = {
    user: req.user.id,
    ratingType,
    rating,
    description,
    order: orderId,
  };

  // Add the specific ID based on rating type
  ratingData[ratingType] = itemId;
  switch (ratingType) {
    case "restaurant":
      ratingData.restaurant = itemId;
      break;
    case "deliveryAgent":
      ratingData.deliveryAgent = itemId;
      break;
    case "food":
      ratingData.food = itemId;
      break;
  }

  const newRating = new Rating(ratingData);

  await newRating.save();

  // Update rating for the respective entity
  let Model;
  switch (ratingType) {
    case "restaurant":
      Model = Restaurant;
      break;
    case "deliveryAgent":
      Model = DeliveryAgent;
      break;
    case "food":
      Model = Food;
      break;
  }

  const ratedEntity = await Model.findById(itemId);

  if (!ratedEntity) {
    return res
      .status(404)
      .json({ success: false, message: `${ratingType} not found` });
  }

  const newRatingCount = (ratedEntity.ratingCount || 0) + 1;
  const newRatingValue =
    ((ratedEntity.rating || 0) * (ratedEntity.ratingCount || 0) + rating) /
    newRatingCount;

  ratedEntity.rating = parseFloat(newRatingValue.toFixed(1));
  ratedEntity.ratingCount = newRatingCount;

  await ratedEntity.save();

  res.status(201).json({
    success: true,
    data: newRating,
  });
});

exports.unifiedSearch = catchAsync(async (req, res, next) => {
  const { query, lat, lng, page = 1, limit = 10, type = "all" } = req.body;
  console.log(req.body);
  if (!query || !lat || !lng) {
    return next(
      new AppError("Please provide search query, latitude, and longitude", 400)
    );
  }

  const coordinates = [parseFloat(lng), parseFloat(lat)];
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;

  // Ensure indexes are created
  await Restaurant.collection.createIndex({
    "address.coordinates": "2dsphere",
  });
  await Restaurant.collection.createIndex({
    name: "text",
    "categoryServes.name": "text",
  });
  await Food.collection.createIndex({ name: "text", description: "text" });
  await Food.collection.createIndex({ restaurantId: 1 });

  // Restaurant queries
  const restaurantTextSearchPipeline = [
    { $match: { $text: { $search: query } } },
    {
      $project: {
        name: 1,
        logo: 1,
        image: { $arrayElemAt: ["$images", 0] },
        rating: 1,
        ratingCount: 1,
        priceForOne: 1,
        cuisines: "$categoryServes.name",
        address: "$address.addressLine",
        location: "$address.coordinates",
        createdAt: 1,
      },
    },
  ];

  const restaurantGeoSearchPipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates },
        distanceField: "distance",
        maxDistance: 1000000, // 1000km in meters
        spherical: true,
      },
    },
    {
      $project: {
        _id: 1,
        distance: 1,
      },
    },
  ];

  // Food queries
  const foodTextSearchPipeline = [
    { $match: { $text: { $search: query } } },
    {
      $lookup: {
        from: "restaurants",
        localField: "restaurantId",
        foreignField: "_id",
        as: "restaurant",
      },
    },
    { $unwind: "$restaurant" },
    {
      $project: {
        name: 1,
        image: { $arrayElemAt: ["$images", 0] },
        rating: 1,
        ratingCount: 1,
        price: 1,
        discountedPrice: 1,
        veg: 1,
        description: 1,
        customizable: {
          $cond: [{ $ifNull: ["$availableTimings", false] }, true, false],
        },
        isBestseller: { $gte: ["$rating", 4.5] },
        restaurantId: "$restaurant._id",
        restaurantName: "$restaurant.name",
        restaurantLocation: "$restaurant.address.coordinates",
      },
    },
  ];

  // Execute queries
  const [
    restaurantsText,
    restaurantsGeo,
    foodsText,
    totalRestaurants,
    totalFoods,
  ] = await Promise.all([
    Restaurant.aggregate(restaurantTextSearchPipeline),
    Restaurant.aggregate(restaurantGeoSearchPipeline),
    Food.aggregate(foodTextSearchPipeline),
    Restaurant.countDocuments({ $text: { $search: query } }),
    Food.countDocuments({ $text: { $search: query } }),
  ]);

  // Combine and filter results
  const restaurantMap = new Map(
    restaurantsGeo.map((r) => [r._id.toString(), r.distance])
  );
  const restaurants = restaurantsText
    .filter((r) => restaurantMap.has(r._id.toString()))
    .map((r) => ({
      ...r,
      distance: restaurantMap.get(r._id.toString()),
    }))
    .sort((a, b) => a.distance - b.distance);

  const foodMap = new Map(foodsText.map((f) => [f._id.toString(), f]));
  const foods = restaurantsGeo
    .flatMap((r) => {
      const restaurantFoods = foodsText.filter((f) =>
        f.restaurantId.equals(r._id)
      );
      return restaurantFoods.map((f) => ({
        ...f,
        distance: r.distance,
      }));
    })
    .filter((f) => foodMap.has(f._id.toString()))
    .sort((a, b) => a.distance - b.distance);

  // Apply pagination based on type
  let paginatedRestaurants = [];
  let paginatedFoods = [];
  let totalResults = 0;

  if (type === "restaurants" || type === "all") {
    paginatedRestaurants = restaurants.slice(skip, skip + parsedLimit);
    totalResults += totalRestaurants;
  }

  if (type === "foods" || type === "all") {
    paginatedFoods = foods.slice(skip, skip + parsedLimit);
    totalResults += totalFoods;
  }

  // Format results
  const formattedRestaurants = paginatedRestaurants.map((restaurant) => ({
    id: restaurant._id,
    name: restaurant.name,
    logo: restaurant.logo,
    image: restaurant.image,
    rating: restaurant.rating.toFixed(1),
    ratingCount: `${restaurant.ratingCount}+ ratings`,
    cuisines: restaurant.cuisines ? restaurant.cuisines.join(" • ") : "",
    priceForOne: `₹${restaurant.priceForOne} for one`,
    distance: `${(restaurant.distance / 1000).toFixed(1)} km`,
    deliveryTime: `${calculateDeliveryTime(restaurant.distance / 1000)} min`,
    freeDelivery: restaurant.distance <= 3000,
    offer: "50% OFF up to ₹80", // This should be dynamically calculated based on actual offers
    promoted: false, // This should be determined based on your business logic
    new:
      (new Date() - new Date(restaurant.createdAt)) / (1000 * 60 * 60 * 24) <=
      30,
  }));

  const formattedFoods = paginatedFoods.map((food) => ({
    id: food._id,
    name: food.name,
    image: food.image,
    rating: food.rating.toFixed(1),
    ratingCount: `${food.ratingCount}+ ratings`,
    price: food.price,
    discountedPrice: food.discountedPrice,
    veg: food.veg,
    description: food.description,
    customizable: food.customizable,
    isBestseller: food.isBestseller,
    restaurantId: food.restaurantId,
    restaurantName: food.restaurantName,
    distance: `${(food.distance / 1000).toFixed(1)} km`,
    deliveryTime: `${calculateDeliveryTime(food.distance / 1000)} min`,
  }));

  const totalPages = Math.ceil(totalResults / parsedLimit);

  res.status(200).json({
    success: true,
    restaurants: formattedRestaurants,
    foods: formattedFoods,
    pagination: {
      currentPage: parsedPage,
      totalPages: totalPages,
      totalResults: totalResults,
      limit: parsedLimit,
    },
    message: "Search results retrieved successfully",
  });
});

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
  } else {
    await sendOtpSms(phone);
  }

  res.status(200).json({
    success: true,
    message: "Otp sent successfully",
  });
});

exports.successGoogleLogin = catchAsync(async (req, res, next) => {
  const { name, email, picture } = req.user._json;

  const user = await User.findOne({ email });
  console.log("db user", user);
  if (user) {
    user.email = email;
    user.name = name;
    user.image = picture;
  } else {
    await User.create({
      email,
      name,
      image: picture,
    });
  }
  res.status(200).json({
    success: true,
    message: "Login successful",
  });
});

exports.failureGoogleLogin = catchAsync(async (req, res, next) => {
  return next(
    new AppError("Error occured while login/signup through google", 500)
  );
});

exports.successFacebookLogin = catchAsync(async (req, res, next) => {
  console.log("user", req.user);
  res.status(200).json({
    success: true,
    message: "Login successful",
  });
});

exports.failureFacebookLogin = catchAsync(async (req, res, next) => {
  return next(
    new AppError("Error occured while login/signup through facebook", 500)
  );
});

exports.getAddresses = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  res.status(200).json({
    success: true,
    message: "All addresses",
    addresses: user.addresses,
  });
});

exports.addAddress = catchAsync(async (req, res, next) => {
  const { lat, lng, state, city, pinCode, addressLine, userId } = req.body;

  if (!userId || !state || !city || !pinCode || !lat || !lng || !addressLine) {
    return next(new AppError("All fields are required", 400));
  }

  const newAddress = await Address.create({
    user: userId,
    lat,
    lng,
    state,
    city,
    pinCode,
    addressLine,
  });

  res.status(201).json({
    success: true,
    message: "Address added successfully",
    address: newAddress,
  });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
  const { lat, lng, state, city, pinCode, addressLine, userId, addressId } =
    req.body;

  if (
    !userId ||
    !state ||
    !city ||
    !pinCode ||
    !lat ||
    !lng ||
    !addressLine ||
    !addressId
  ) {
    return next(new AppError("All fields are required", 400));
  }

  const updatedAddress = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    { lat, lng, state, city, pinCode, addressLine },
    { new: true, runValidators: true }
  );

  if (!updatedAddress) {
    return next(new AppError("Address not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    address: updatedAddress,
  });
});

exports.removeAddress = catchAsync(async (req, res, next) => {
  const { addressId, userId } = req.body;

  if (!userId || !addressId) {
    return next(new AppError("All fields are required", 400));
  }

  const result = await Address.deleteOne({ _id: addressId, user: userId });

  if (result.deletedCount === 0) {
    return next(new AppError("Address not found or already removed", 404));
  }

  res.status(200).json({
    success: true,
    message: "Address removed successfully",
  });
});

exports.getRestaurantsNearUser = catchAsync(async (req, res, next) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return next(new AppError("Latitude and Longitude are required.", 400));
  }

  // Perform geospatial query to find nearby top-rated restaurants
  const restaurants = await Restaurant.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        distanceField: "distance",
        spherical: true,
        maxDistance: 10000, // 10 kilometers
      },
    },
    {
      $match: {
        isSubscriptionActive: true,
        rating: { $gt: 0 }, // Only include restaurants with ratings
      },
    },
    {
      $sort: { rating: -1 }, // Sort by rating in descending order
    },
    {
      $limit: 5, // Limit to top 5 restaurants
    },
    {
      $project: {
        _id: 1,
        name: 1,
        rating: 1,
        ratingCount: 1,
        // cuisines: 1,
        images: { $slice: ["$images", 1] }, // Get the first image
        distance: 1,
        deliveryTime: {
          $round: [{ $divide: ["$distance", 100] }, 0], // Estimate delivery time based on distance
        },
        priceForOne: "$averagePrice",
        discount: {
          $cond: {
            if: { $gt: ["$discount", 0] },
            then: { $concat: [{ $toString: "$discount" }, "% OFF"] },
            else: null,
          },
        },
      },
    },
  ]);

  // Format the response to match the restaurant card design
  const formattedRestaurants = restaurants.map((restaurant) => ({
    id: restaurant._id,
    name: restaurant.name,
    rating: restaurant.rating.toFixed(1),
    ratingCount: restaurant.ratingCount,
    // cuisines: restaurant.cuisines.join(", "\

    imageUrl: restaurant.images[0],
    distance: `${(restaurant.distance / 1000).toFixed(1)} km`,
    deliveryTime: `${restaurant.deliveryTime} Min`,
    priceForOne: `₹${restaurant.priceForOne} for one`,
    discount: restaurant.discount,
  }));

  res.status(200).json({
    success: true,
    count: formattedRestaurants.length,
    restaurants: formattedRestaurants,
    message: "Top rated restaurants near user retrieved successfully",
  });
});

exports.getRestaurantsbyCusine = catchAsync(async (req, res) => {
  try {
    const { cuisineId, lat, lng } = req.body;

    if (!cuisineId || !lat || !lng) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const restaurants = await Restaurant.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          maxDistance: 10000, // 10km in meters
          spherical: true,
          query: { cuisines: mongoose.Types.ObjectId(cuisineId) },
        },
      },
      {
        $lookup: {
          from: "cuisines",
          localField: "cuisines",
          foreignField: "_id",
          as: "cuisineDetails",
        },
      },
      {
        $project: {
          name: 1,
          cuisineDetails: 1,
          rating: 1,
          ratingCount: 1,
          priceForOne: 1,
          images: { $arrayElemAt: ["$images", 0] },
          distance: 1,
          restaurantType: 1,
          isSubscriptionActive: 1,
        },
      },
      {
        $addFields: {
          distanceInKm: { $round: [{ $divide: ["$distance", 1000] }, 1] },
          deliveryTime: {
            $add: [
              20,
              { $multiply: [5, { $floor: { $divide: ["$distance", 1000] } }] },
            ],
          },
        },
      },
    ]);

    const formattedRestaurants = restaurants.map((restaurant) => ({
      name: restaurant.name,
      cuisines: restaurant.cuisineDetails.map((c) => c.name).join(", "),
      rating: restaurant.rating.toFixed(1),
      ratingCount: `${restaurant.ratingCount}+`,
      deliveryTime: `${restaurant.deliveryTime} MIN`,
      priceForOne: `₹${restaurant.priceForOne} for one`,
      promotionalOffer: restaurant.isSubscriptionActive
        ? "50% OFF up to ₹90"
        : null,
      imageUrl: restaurant.images,
      distance: `${restaurant.distanceInKm} km`,
      freeDelivery: restaurant.distance <= 3000,
    }));

    res.json(formattedRestaurants);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// exports.getRestaurantsNearUser = catchAsync(async (req, res, next) => {
//   const { lat, lng } = req.query;

//   if (!lat || !lng) {
//     return next(new AppError("Latitude and Longitude are required.", 400));
//   }

//   // Perform geospatial query to find nearby restaurants
//   const restaurants = await Restaurant.aggregate([
//     {
//       $geoNear: {
//         near: {
//           type: "Point",
//           coordinates: [parseFloat(lng), parseFloat(lat)],
//         },
//         distanceField: "distance",
//         spherical: true,
//         maxDistance: 10000, // 10 kilometers
//       },
//     },
//   ]);

//   res.status(200).json({
//     success: true,
//     restaurants,
//     message: "Restaurants near user retrieved successfully",
//   });
// });

exports.getUserProfile = catchAsync(async (req, res, next) => {
  const userId = req?.user?._id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found.", 404));
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
    return next(new AppError("User not found.", 404));
  }

  user.name = name;
  user.gender = gender;
  if (image?.path) {
    user.image = image?.path;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
  });
});

exports.getUserOrders = catchAsync(async (req, res, next) => {
  const userId = req?.user?._id;

  const orders = await Order.find({ userId });

  if (!orders) {
    return next(new AppError("No orders found for this user.", 404));
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
    return next(new AppError("No favorites found for this user.", 404));
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
    return next(new AppError("All fields are required.", 400));
  }

  await Favorite.create({ userId, restaurantId, productId });

  res.status(200).json({
    success: true,
    message: "Added to Favorite",
  });
});

exports.removeFromFav = catchAsync(async (req, res, next) => {
  const userId = req?.user?._id;
  const { restaurantId, productId } = req.body;

  await Favorite.findOneAndDelete({ userId, productId, restaurantId });

  res.status(200).json({
    success: true,
    message: "Removed from Favorite",
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
    return next(new AppError("All fields are required.", 400));
  }

  await Review.create({
    title,
    description,
    rating,
    reviewBy: { type: "user", userId },
    reviewTo,
  });

  res.status(200).json({
    success: true,
    message: "Review added successfully",
  });
});

exports.getUserReviews = catchAsync(async (req, res, next) => {
  const userId = req?.user?._id;

  const reviews = await Review.find({ reviewBy: { userId } });

  if (!reviews) {
    return next(new AppError("No reviews found for this user.", 404));
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
    return next(new AppError("User not found.", 404));
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
    } else {
      restaurants = await Food.find({ veg: true });
    }
  } else {
    restaurants = await Restaurant.find();
  }

  res.status(200).json({
    success: true,
    message: "Restaurant by vegMode retrieved successfully",
    data: restaurants,
  });
});

exports.addToCartOrIncreaseQty = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      products: [{ productId, quantity: quantity || 1 }],
    });
  } else {
    const productIndex = cart.products.findIndex((p) =>
      p.productId.equals(productId)
    );

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
    return next(new AppError("Cart not found.", 404));
  }

  const productIndex = cart.products.findIndex((p) =>
    p.productId.equals(productId)
  );

  if (productIndex === -1) {
    return next(new AppError("Food not found in cart.", 404));
  }

  if (cart.products[productIndex].quantity === 1) {
    cart.products = cart.products.filter((p) => !p.productId.equals(productId));
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
    return next(new AppError("Cart not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Cart cleared.",
  });
});

exports.getCartDetails = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ userId }).populate("products.productId");

  if (!cart) {
    return next(new AppError("No cart found for this user.", 404));
  }

  res.status(200).json({
    success: true,
    cart,
  });
});

exports.placeOrder = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const {
    restaurantId,
    deliveryTime,
    cookingInstructions,
    tip,
    orderValue,
    address,
    discount,
  } = req.body;

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return next(new AppError("Cart not found.", 404));
  }

  if (cart.products.length === 0) {
    return next(new AppError("No products in cart.", 400));
  }

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
    products: cart.products,
  });

  await order.save();

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
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      // Clear session cookie
      res.clearCookie("connect.sid"); // Default session cookie name

      // Handle token-based logout
      // Clear JWT cookie (if applicable)
      res.clearCookie("token"); // Replace 'authToken' with your token cookie name

      // Send response
      res.status(200).json({ message: "Logout successful" });
    });
  } else {
    // Handle token-based logout if no session exists
    res.clearCookie("token");
    res.clearCookie("connect.sid"); // Default session cookie name
    res.status(200).json({
      success: true,
      message: "Logout successfully!",
    });
  }
});
exports.searchRestaurantsAndDishesA = catchAsync(async (req, res, next) => {
  const { search, userLocation } = req.body;

  if (!search || !userLocation || !userLocation.lat || !userLocation.lng) {
    return next(
      new AppError("Please provide a search term and valid user location", 400)
    );
  }
  // db.restaurants.getIndexes();
  // Step 1: Find nearby restaurants

  // const restaurants = await Restaurant.aggregate([
  //   {
  //     $geoNear: {
  //       near: {
  //         type: "Point",
  //         coordinates: [userLocation.lng, userLocation.lat],
  //       }, // Use actual coordinates
  //       distanceField: "dist.calculated",
  //       maxDistance: 10000, // 10 km in meters
  //       spherical: true,
  //       query: { isSubscriptionActive: true }, // Add any additional filters here
  //     },
  //   },
  // ]);

  const restaurants = await Restaurant.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [userLocation.lng, userLocation.lat],
        },
        distanceField: "distance",
        maxDistance: 10000, // 10 km
        spherical: true,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "categoryServes.categoryId",
        foreignField: "_id",
        as: "categories",
      },
    },
    {
      $match: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { "categories.name": { $regex: search, $options: "i" } },
        ],
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        restaurantType: 1,
        address: 1,
        categoryServes: 1,
        isSubscriptionActive: 1,
        distance: 1, // Include distance in the output
      },
    },
  ]);

  // Step 2: Find nearby food dishes
  // const dishes = await Food.aggregate([
  //   {
  //     $geoNear: {
  //       near: {
  //         type: "Point",
  //         coordinates: [userLocation.lng, userLocation.lat],
  //       },
  //       distanceField: "distance",
  //       maxDistance: 10000, // 10 km
  //       spherical: true,
  //       query: {
  //         $or: [
  //           { name: { $regex: search, $options: "i" } },
  //           { description: { $regex: search, $options: "i" } },
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "restaurants",
  //       localField: "restaurantId",
  //       foreignField: "_id",
  //       as: "restaurant",
  //     },
  //   },
  //   {
  //     $unwind: "$restaurant",
  //   },
  //   {
  //     $project: {
  //       name: 1,
  //       description: 1,
  //       price: 1,
  //       discountedPrice: 1,
  //       veg: 1,
  //       restaurant: "$restaurant.name",
  //       distance: 1, // Include distance in the output
  //     },
  //   },
  // ]);

  res.status(200).json({
    success: true,
    restaurants,
    // dishes,
    message: "Restaurants and dishes retrieved successfully",
  });
});

exports.searchRestaurantsAndDishes = catchAsync(async (req, res, next) => {
  const { search } = req.body;

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
          as: "categories",
        },
      },
      {
        $match: {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { "categories.name": { $regex: search, $options: "i" } },
          ],
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          restaurantType: 1,
          address: 1,
          categoryServes: 1,
          isSubscriptionActive: 1,
        },
      },
    ]);

    const dishes = await Food.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    }).populate("restaurantId", "name");

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

exports.filterAndSortRestaurants = catchAsync(async (req, res, next) => {
  const { rating, vegMode, sortBy, lat, lng, maxDistance = 2000 } = req.query;

  // Build the match stage for filtering
  const matchStage = {};
  let pipeline = [];

  if (rating) {
    // matchStage.rating = { $gte: parseInt(3) };
    pipeline.push(
      {
        $lookup: {
          from: "reviews", // Collection name
          localField: "_id",
          foreignField: "reviewTo.restaurantId",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" },
        },
      },
      {
        $match: { averageRating: { $gte: parseFloat(rating) } },
      }
    );
  }

  if (vegMode === "pureVeg") {
    matchStage.restaurantType = "veg";
  }

  console.log("matchstage", matchStage);

  // Create aggregation pipeline

  // Geospatial Query Stage
  if (lat && lng & maxDistance) {
    pipeline.push({
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        distanceField: "distance",
        maxDistance: parseInt(maxDistance), // Convert km to meters
        spherical: true,
      },
    });
  }

  // Match Stage
  if (Object.keys(matchStage).length) {
    pipeline.push({ $match: matchStage });
  }

  // Sort Stage
  let sortStage = {};
  switch (sortBy) {
    case "rating":
      sortStage.rating = -1; // High to Low
      break;
    // case 'costLowToHigh':
    //     sortStage.cost = 1; // Low to High
    //     break;
    // case 'costHighToLow':
    //     sortStage.cost = -1; // High to Low
    //     break;
    case "distance":
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
  restaurants = restaurants.map((restaurant) => {
    const distance = calculateDistance(
      lat,
      lng,
      restaurant.address.coordinates[1],
      restaurant.address.coordinates[0]
    );
    restaurant.deliveryTime = calculateDeliveryTime(distance);
    return restaurant;
  });

  // Sort by delivery time if requested
  if (sortBy === "deliveryTime") {
    restaurants.sort((a, b) => a.deliveryTime - b.deliveryTime);
  }

  if (!restaurants.length) {
    return next(
      new AppError("No restaurants found matching the criteria.", 404)
    );
  }

  res.status(200).json({
    success: true,
    restaurants,
    length: restaurants.length,
  });
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
  const userId = req?.user?._id;
  const { orderId } = req.params;
  const { cancellationReason } = req.body;

  if (!orderId || !cancellationReason) {
    return next(
      new AppError("OrderId and cancellationReason are required.", 400)
    );
  }

  const order = await Order.findOneAndUpdate(
    { _id: orderId },
    {
      status: "cancelled",
      cancellationReason,
      cancelledBy: "user",
    },
    { new: true }
  );

  if (!order) {
    return next(
      new AppError("Order not found or already completed/cancelled", 404)
    );
  }

  const assignedOrder = await AssignedOrders.findOneAndUpdate(
    { orderId },
    {
      status: "cancelled",
      cancellationReason,
      cancelledBy: "user",
    },
    { new: true }
  );

  if (!assignedOrder) {
    return next(
      new AppError(
        "Assigned order not found or already completed/cancelled",
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully!",
  });
});

exports.getOrderDetails = catchAsync(async (req, res, next) => {
  const userId = req?.user?._id;
  const { orderId } = req.params;

  if (!orderId) {
    return next(new AppError("OrderId is required.", 400));
  }

  const order = await Order.findOne({ _id: orderId })
    .populate("userId")
    .populate("restaurantId")
    .populate("products.productId");

  if (!order) {
    return next(new AppError("No order found with this id.", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getOrderLocation = catchAsync(async (req, res, next) => {
  const userId = req?.user?._id;
  const { orderId } = req.params;

  if (!orderId) {
    return next(new AppError("OrderId is required.", 400));
  }

  const order = await Order.findOne({ _id: orderId });

  if (!order) {
    return next(new AppError("No order found with this id and user.", 404));
  }

  res.status(200).json({
    success: true,
    location: {
      lat: order.address.lat,
      lng: order.address.lng,
    },
  });
});

exports.applyCoupon = catchAsync(async (req, res, next) => {
  const { couponCode, orderValue } = req.body;

  if (!couponCode || orderValue === undefined) {
    return next(new AppError("Coupon code and order value are required.", 400));
  }

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
  if (!coupon) {
    return next(new AppError("Invalid coupon code.", 400));
  }

  if (new Date() > coupon.expiry) {
    return next(new AppError("Coupon has expired.", 400));
  }

  // Calculate discount
  let discount = 0;
  if (coupon.percentage) {
    discount = (orderValue * coupon.percentage) / 100;
    discount > coupon.maxLimit ? (discount = coupon.maxLimit) : discount;
  } else if (coupon.amount) {
    discount = coupon.amount;
  }

  const finalOrderValue = orderValue - discount;

  res.status(200).json({
    success: true,
    message: "Coupon applied successfully",
    coupon,
    discount,
    orderValue: finalOrderValue,
  });
});

exports.addComplaint = catchAsync(async (req, res, next) => {
  const userId = req?.user?._id;
  const { orderId, deliveryExecId, restaurantId, description, type } = req.body;

  if (!description || !type) {
    return next(
      new AppError("Description and complaint type are required.", 400)
    );
  }

  const complaint = new Complaint({
    userId: userId || null,
    orderId: orderId || null,
    deliveryExecId: deliveryExecId || null,
    restaurantId: restaurantId || null,
    description,
    type,
    status: "Pending",
  });

  await complaint.save();

  res.status(201).json({
    success: true,
    message: "Complaint added successfully",
  });
});
//spotlight
exports.getSpotlightCuisines = catchAsync(async (req, res, next) => {
  const spotlightCuisines = await Cuisine.find({ spotlight: true });

  if (spotlightCuisines.length === 0) {
    return next(new AppError("No spotlight cuisines found", 404));
  }

  res.status(200).json({
    status: "success",
    results: spotlightCuisines.length,
    data: {
      cuisines: spotlightCuisines,
    },
  });
});

exports.getRestaurantsByCuisine = catchAsync(async (req, res, next) => {
  const { cuisineId, lat, lng, page = 1, limit = 10 } = req.body;

  if (!cuisineId || !lat || !lng) {
    return next(
      new AppError("Cuisine ID, latitude, and longitude are required", 400)
    );
  }
  console.log(cuisineId);
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const radius = 10 / 6378.1; // 10 km radius (Earth's radius in kilometers)
  const cuisineObjectIds = new mongoose.Types.ObjectId(cuisineId);

  const restaurants = await Restaurant.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "distance",
        maxDistance: 10000, // 10km in meters
        spherical: true,
        query: { cuisines: cuisineObjectIds },
      },
    },
    {
      $lookup: {
        from: "cuisines",
        localField: "cuisines",
        foreignField: "_id",
        as: "cuisineDetails",
      },
    },
    {
      $addFields: {
        cuisineTypes: {
          $reduce: {
            input: "$cuisineDetails",
            initialValue: "",
            in: {
              $cond: {
                if: { $eq: ["$$value", ""] },
                then: "$$this.name",
                else: { $concat: ["$$value", " • ", "$$this.name"] },
              },
            },
          },
        },
        freeDelivery: {
          $cond: { if: { $lte: ["$distance", 3000] }, then: true, else: false },
        }, // 3000 meters = 3 km
      },
    },
    { $sort: { name: 1 } }, // Sort by name, or you can change it to distance if calculated
    { $skip: skip },
    { $limit: limitNum },
    {
      $project: {
        name: 1,
        logo: 1, // Logo of the restaurant
        bannerImage: 1, // Image or promotional banner
        cuisineTypes: 1, // Cuisine types in "Pizza • Burger • Desserts" format
        rating: 1, // Star rating
        ratingCount: 1, // Rating count, e.g. 850+ ratings
        deliveryTime: 1, // Delivery time
        distance: 1, // Distance from user
        priceForOne: 1, // Price for one
        freeDelivery: 1, // Free delivery boolean
        isNew: 1, // "NEW" tag (true/false)
      },
    },
  ]);

  console.log(restaurants);

  const totalRestaurants = await Restaurant.countDocuments({
    cuisines: cuisineId,
    "address.coordinates": {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], 10 / 6378.1], // 10km radius
      },
    },
  });

  console.log(totalRestaurants);

  res.status(200).json({
    status: "success",
    results: restaurants.length,
    totalPages: Math.ceil(totalRestaurants / limitNum),
    currentPage: pageNum,
    data: {
      restaurants,
    },
  });
});
//menu constroller
const populateCategories = async (categories) => {
  const populatedCategories = await Promise.all(
    categories.map(async (category) => {
      const populatedCategory = await Category.findById(category._id).populate({
        path: "foodItems",
        select: "name _id",
      });

      const subcategories = await Category.find({
        parentCategory: category._id,
      });
      const populatedSubcategories = await populateCategories(subcategories);

      return {
        _id: populatedCategory._id,
        name: populatedCategory.name,
        foodItems: populatedCategory.foodItems,
        subcategories: populatedSubcategories,
      };
    })
  );

  return populatedCategories;
};

exports.getRestraunt = catchAsync(async (req, res) => {
  const { restaurantId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid restaurant ID" });
  }

  // Fetch restaurant details
  const restaurant = await Restaurant.findById(restaurantId).select(
    "name logo"
  );
  if (!restaurant) {
    return res
      .status(404)
      .json({ success: false, message: "Restaurant not found" });
  }
  const foodItems = await Food.find({ restaurantId }).populate(
    "cuisine",
    "name"
  );

  const currentTime = new Date();
  const currentDay = currentTime.toLocaleString("en-US", { weekday: "long" });

  const formattedFoodItems = foodItems.map((item) => {
    const isAvailableNow =
      item.availableTimings.days.includes(currentDay) &&
      currentTime >= item.availableTimings.start &&
      currentTime <= item.availableTimings.end;

    const discountPercentage = Math.round(
      (1 - item.discountedPrice / item.price) * 100
    );

    return {
      id: item._id,
      name: item.name,
      price: item.price,
      discountedPrice: item.discountedPrice,
      description: item.description,
      rating: item.rating.toFixed(1),
      ratingCount: `${item.ratingCount} ratings`,
      imageUrl: item.images[0], // Assuming the first image is the main image
      isVeg: item.veg,
      cuisine: item.cuisine.name,
      isAvailableNow: isAvailableNow,
      discountPercentage:
        discountPercentage > 0 ? `${discountPercentage}% OFF` : null,
    };
  });

  res.json({
    success: true,
    restaurant: {
      name: restaurant.name,
      logo: restaurant.logo, // Assuming the first image is the logo
    },
    count: formattedFoodItems.length,
    data: formattedFoodItems,
  });
});

exports.getHierarchicalMenu = catchAsync(async (req, res, next) => {
  const { restaurantId } = req.params;

  if (!restaurantId) {
    return next(new AppError("Restaurant ID is required", 400));
  }

  // Get all categories for the restaurant
  const categories = await Category.find({ restaurantId }).lean();

  // Create a map of categories by ID for easy lookup
  const categoryMap = new Map(
    categories.map((c) => [
      c._id.toString(),
      { ...c, subCategories: [], foodItems: [] },
    ])
  );

  // Organize categories into a hierarchy
  const rootCategories = [];
  categoryMap.forEach((category) => {
    if (category.parentCategory) {
      const parentCategory = categoryMap.get(
        category.parentCategory.toString()
      );
      if (parentCategory) {
        parentCategory.subCategories.push(category);
      }
    } else {
      rootCategories.push(category);
    }
  });

  // Get all food items for the restaurant with populated fields
  const foodItems = await Food.find({ restaurantId })
    .populate("variationIds")
    .populate("addOnIds")
    .populate({
      path: "customizationIds",
      populate: {
        path: "options",
        model: "CustomizationOption",
      },
    })
    .lean();

  // Assign food items to their categories
  foodItems.forEach((food) => {
    const category = categoryMap.get(food.categoryId.toString());
    if (category) {
      category.foodItems.push({
        id: food._id,
        name: food.name,
        description: food.description,
        price: food.price,
        discountedPrice: food.discountedPrice,
        image: food.images && food.images.length > 0 ? food.images[0] : null,
        veg: food.veg,
        rating: food.rating,
        preparationTime: food.preparationTime,
        variations: food.variationIds,
        addOns: food.addOnIds,
        customizations: food.customizationIds,
        isAvailable: food.isAvailable,
      });
    }
  });

  // Function to recursively sort categories and food items
  const sortHierarchy = (categories) => {
    categories.sort((a, b) => a.name.localeCompare(b.name));
    categories.forEach((category) => {
      if (category.subCategories.length > 0) {
        sortHierarchy(category.subCategories);
      }
      category.foodItems.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  // Sort the entire hierarchy
  sortHierarchy(rootCategories);

  // Function to remove empty categories
  const removeEmptyCategories = (categories) => {
    return categories.filter((category) => {
      category.subCategories = removeEmptyCategories(category.subCategories);
      return category.foodItems.length > 0 || category.subCategories.length > 0;
    });
  };

  // Remove empty categories
  const filteredRootCategories = removeEmptyCategories(rootCategories);

  res.status(200).json({
    success: true,
    data: filteredRootCategories,
  });
});

exports.getFoodItemDetails = catchAsync(async (req, res, next) => {
  const { foodId } = req.params;

  const foodItem = await Food.findById(foodId)
    .populate("variationIds")
    .populate("addOnIds")
    .populate({
      path: "customizationIds",
      populate: {
        path: "options",
        model: "CustomizationOption",
      },
    });

  if (!foodItem) {
    return next(new AppError("Food item not found", 404));
  }

  const response = {
    id: foodItem._id,
    name: foodItem.name,
    description: foodItem.description,
    price: foodItem.price,
    discountedPrice: foodItem.discountedPrice,
    image:
      foodItem.images && foodItem.images.length > 0 ? foodItem.images[0] : null,
    veg: foodItem.veg,
    rating: foodItem.rating,
    ratingCount: foodItem.ratingCount,
    preparationTime: foodItem.preparationTime,
    isAvailable: foodItem.isAvailable,
    variations: foodItem.variationIds.map((variation) => ({
      id: variation._id,
      name: variation.name,
      price: variation.price,
      discountedPrice: variation.discountedPrice,
      isDefault: variation.isDefault,
      inStock: variation.inStock,
    })),
    addOns: foodItem.addOnIds.map((addOn) => ({
      id: addOn._id,
      name: addOn.name,
      price: addOn.price,
      isDefault: addOn.isDefault,
      inStock: addOn.inStock,
    })),
    customizations: foodItem.customizationIds.map((customization) => ({
      id: customization._id,
      name: customization.name,
      type: customization.type,
      required: customization.required,
      options: customization.options.map((option) => ({
        id: option._id,
        name: option.name,
        price: option.price,
        isDefault: option.isDefault,
      })),
    })),
  };

  res.status(200).json({
    success: true,
    data: response,
  });
});
