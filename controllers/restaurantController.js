const { default: mongoose } = require("mongoose");
const Cuisine = require("../models/cuisineModel");
const Restaurant = require("../models/restaurantModel");
const catchAsync = require("../utils/catchAsync");
const Coupon = require("../models/couponModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const AppError = require("../utils/appError");
const bcrypt = require("bcryptjs");
const Review = require("../models/reviewModel");
const Order = require("../models/orderModel");
const AssignedOrders = require("../models/assignedOrdersModel");
const Complaint = require("../models/complaintModel");

exports.addRestaurant = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    phone,
    restaurantType,
    lat,
    lng,
    addressLine,
    city,
    state,
    pinCode,
    cuisines,
    isSubscriptionActive,
  } = req.body;
  const files = req.files;
  const logopath = files["logo"].path;
  const imagespaths = files["images"].map((image) => image.path);

  if (
    !name ||
    !email ||
    !password ||
    !phone ||
    !restaurantType ||
    !addressLine ||
    !city ||
    !state ||
    !pinCode ||
    !lat ||
    !lng
  ) {
    return next(new AppError("All fields are required.", 400));
  }

  const existingRestaurant = await Restaurant.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingRestaurant) {
    return next(
      new AppError("A restaurant with this email or phone already exists", 400)
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const newRestaurant = new Restaurant({
    name,
    phone,
    email,
    logo: logopath,
    images: imagespaths,
    password: passwordHash,
    address: {
      type: "Point",
      coordinates: [lng, lat],
      addressLine,
      city,
      state,
      pinCode,
    },
    restaurantType,
    cuisines,
    isSubscriptionActive,
  });

  await newRestaurant.save();

  res.status(200).json({
    success: true,
    message: "Restaurant added successfully",
  });
});

exports.getRestaurants = catchAsync(async (req, res, next) => {
  const restaurants = await Restaurant.find({});

  res.status(200).json({
    success: true,
    message: "All restaurants",
    restaurants,
  });
});

exports.searchRestaurants = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  const restaurants = await Restaurant.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "CusineServes.CusineId",
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
  ]);

  res.status(200).json({
    success: true,
    restaurants,
    message: "restaurants sent!",
  });
});

exports.addCuisine = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  const image = req.files.image[0].path;
  console.log("image", image);

  // Validate input
  // if (!name || !image) {
  //   return next(new AppError("Name and image are required fields.", 400));
  // }
  // Check if cuisine with this name already exists
  const existingCuisine = await Cuisine.findOne({ name });
  if (existingCuisine) {
    return next(new AppError("A cuisine with this name already exists", 400));
  }

  const newCusine = await Cuisine.create({
    name,
    description: description,
    image: image,
  });

  res.status(201).json({
    success: true,
    message: "Cusine created successfully",
  });
  console.log("done");
});

exports.getCuisines = catchAsync(async (req, res, next) => {
  const Cusine = await Cuisine.find();

  res.status(200).json({
    success: true,
    message: "Categories retrieved successfully",
    categories,
  });
});

exports.getRestaurantByCusine = catchAsync(async (req, res, next) => {
  const { CusineId } = req.query;

  if (!CusineId) {
    return next(new AppError("CusineId is required field.", 400));
  }

  const restaurants = await Restaurant.find({
    "CusineServes.CusineId": CusineId,
  });

  res.status(200).json({
    success: true,
    restaurants,
    message: `Restaurants serving Cusine with ID '${CusineId}' retrieved successfully`,
  });
});

exports.updateRestaurant = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    restaurantType,
    lat,
    lng,
    addressLine,
    city,
    state,
    pinCode,
    CusineServes,
    isSubscriptionActive,
  } = req.body;
  const images = req.files;
  let paths;

  if (images && images.length > 0) {
    paths = images.map((image) => image.path);
  }

  // Validate required fields
  if (
    !name ||
    !email ||
    !phone ||
    !restaurantType ||
    !addressLine ||
    !city ||
    !state ||
    !pinCode ||
    !lat ||
    !lng
  ) {
    return next(new AppError("All fields are required.", 400));
  }
  if (CusineServes && CusineServes.length > 0) {
    for (let Cusine of CusineServes) {
      if (!mongoose.Types.ObjectId.isValid(Cusine.CusineId)) {
        return next(new AppError("Invalid Cusine ID.", 400));
      }
      const CusineExists = await Cusine.findById(Cusine.CusineId);
      if (!CusineExists) {
        return next(
          new AppError(`Cusine with ID ${Cusine.CusineId} not found.`, 404)
        );
      }
    }
  }

  // Find the restaurant by ID
  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return next(new AppError("Restaurant not found.", 404));
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
    type: "Point",
    coordinates: [lng, lat],
    addressLine,
    city,
    state,
    pinCode,
  };
  restaurant.CusineServes = CusineServes;
  restaurant.isSubscriptionActive = isSubscriptionActive;

  // Save updated restaurant
  await restaurant.save();

  res.status(200).json({
    success: true,
    message: "Restaurant updated successfully",
    restaurant,
  });
});

exports.deleteRestaurant = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const restaurant = await Restaurant.findByIdAndDelete(id);

  if (!restaurant) {
    return next(new AppError("Restaurant not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Restaurant deleted successfully",
  });
});

exports.addCoupon = catchAsync(async (req, res, next) => {
  const { name, code, expiry, type, percentage, amount, maxLimit } = req.body;

  if (!name || !code || !expiry || !type) {
    return next(new AppError("All fields are required.", 400));
  }

  if (percentage !== undefined) {
    if (percentage < 0 || percentage > 100) {
      return next(new AppError("Percentage must be between 0 and 100.", 400));
    }
    if (maxLimit === undefined) {
      return next(
        new AppError("Max limit is required if percentage is provided.", 400)
      );
    }
  } else if (amount !== undefined) {
    if (amount < 0) {
      return next(
        new AppError("Amount must be greater than or equal to 0.", 400)
      );
    }
  } else {
    return next(new AppError("Either percentage or amount is required.", 400));
  }

  const newCoupon = await Coupon.create({
    name,
    code: code.toUpperCase(),
    expiry,
    type,
    percentage,
    amount,
    maxLimit,
  });

  res.status(201).json({
    success: true,
    message: "Coupon added successfully",
    coupon: newCoupon,
  });
});

exports.updateCoupon = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, code, expiry, type, percentage, amount, maxLimit } = req.body;

  if (percentage !== undefined) {
    if (percentage < 0 || percentage > 100) {
      return next(new AppError("Percentage must be between 0 and 100.", 400));
    }
    if (maxLimit === undefined) {
      return next(
        new AppError("Max limit is required if percentage is provided.", 400)
      );
    }
  } else if (amount !== undefined) {
    if (amount < 0) {
      return next(
        new AppError("Amount must be greater than or equal to 0.", 400)
      );
    }
  } else {
    return next(new AppError("Either percentage or amount is required.", 400));
  }

  const updatedCoupon = await Coupon.findByIdAndUpdate(
    id,
    {
      name,
      code: code.toUpperCase(),
      expiry,
      type,
      percentage,
      amount,
      maxLimit,
    },
    { new: true }
  );

  if (!updatedCoupon) {
    return next(new AppError("Coupon not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Coupon updated successfully",
    coupon: updatedCoupon,
  });
});

exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const deletedCoupon = await Coupon.findByIdAndDelete(id);

  if (!deletedCoupon) {
    return next(new AppError("Coupon not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Coupon deleted successfully",
  });
});

exports.getCoupons = catchAsync(async (req, res, next) => {
  const coupons = await Coupon.find();

  res.status(200).json({
    success: true,
    message: "Coupons retrieved successfully",
    coupons,
  });
});

exports.getCouponDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return next(new AppError("Coupon not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Coupon details retrieved successfully",
    coupon,
  });
});

exports.addProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    price,
    discountedPrice,
    veg,
    description,
    restaurantId,
    CusineId,
    start,
    end,
    days,
  } = req.body;
  const images = req.files;
  const paths = images.map((image) => image.path);

  if (
    !name ||
    !price ||
    !discountedPrice ||
    !description ||
    !restaurantId ||
    !CusineId ||
    !start ||
    !end
  ) {
    return next(new AppError("All fields are required.", 400));
  }

  const newProduct = await Product.create({
    name,
    images: paths,
    price,
    discountedPrice,
    veg,
    description,
    restaurantId,
    CusineId,
    availableTimings: {
      start,
      end,
      days,
    },
  });

  res.status(201).json({
    success: true,
    message: "Product added successfully",
    product: newProduct,
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
    return next(new AppError("Product not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const deletedProduct = await Product.findByIdAndDelete(id);

  if (!deletedProduct) {
    return next(new AppError("Product not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

exports.getProductsByRestaurantId = catchAsync(async (req, res, next) => {
  const { restaurantId } = req.params;

  if (!restaurantId) {
    return next(new AppError("Restaurant ID is required.", 400));
  }

  const products = await Product.find({ restaurantId });

  if (!products.length) {
    return next(new AppError("No products found for this restaurant.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Products retrieved successfully",
    products,
  });
});

exports.getRestaurantReviews = catchAsync(async (req, res, next) => {
  const restaurantId = req?.restaurant?._id;

  const reviews = await Review.find({ "reviewTo.restaurantId": restaurantId });

  if (!reviews) {
    return next(new AppError("No reviews found for this restaurant.", 404));
  }

  res.status(200).json({
    success: true,
    reviews,
  });
});

exports.getProductReviews = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  console.log("productId", productId);

  const reviews = await Review.find({ "reviewTo.productId": productId });

  if (!reviews.length) {
    return next(new AppError("No reviews found for this product.", 404));
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
    return next(new AppError("All fields are required.", 400));
  }

  await Review.create({
    title,
    description,
    rating,
    reviewBy: { restaurantId },
    reviewTo: { deliveryExecId },
  });

  res.status(200).json({
    success: true,
    message: "Review added successfully",
  });
});

exports.getRestaurantDetails = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return next(new AppError("No restaurant found with that ID", 404));
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
    return next(new AppError("No product found with that ID", 404));
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
    return next(new AppError("Order not found", 404));
  }

  order.status = "preparing";
  await order.save();

  res.status(200).json({
    success: true,
    message: "Order accepted successfully!",
  });
});

exports.getOrders = catchAsync(async (req, res, next) => {
  const restaurantId = req?.restaurant?._id;

  if (!restaurantId) {
    return next(new AppError("Restaurant ID not found", 400));
  }

  const orders = await Order.find({ restaurantId, status: "confirmed" });

  if (!orders) {
    return next(new AppError("No orders found for this restaurant", 404));
  }

  res.status(200).json({
    success: true,
    orders,
  });
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { cancellationReason } = req.body;

  if (!orderId || !cancellationReason) {
    return next(
      new AppError("OrderId and cancellationReason are required.", 400)
    );
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      status: "cancelled",
      cancellationReason,
      cancelledBy: "restaurant",
    },
    { new: true }
  );

  if (!order) {
    return next(
      new AppError("Order not found or already completed/cancelled", 404)
    );
  }

  const assignedOrder = await AssignedOrders.findOneAndUpdate(
    { orderId: order._id },
    {
      status: "cancelled",
      cancellationReason,
      cancelledBy: "restaurant",
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

exports.addComplaint = catchAsync(async (req, res, next) => {
  const restaurantId = req?.restaurant?._id;
  const { userId, orderId, deliveryExecId, description, type } = req.body;

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
