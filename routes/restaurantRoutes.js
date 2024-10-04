const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/imgUpload");

const router = express.Router();

router.post(
  "/add-restaurant",
  upload.fields([
    { name: "images", maxCount: 3 },
    { name: "logo", maxCount: 1 },
  ]),
  restaurantController.addRestaurant
); // 19/07/24
// router.post('/login', authController.restaurantLogin); // 19/07/24

// autheniation
// router.use(authController.authenicateRestaurant);

// router.get("/logout", restaurantController.logout); // 20/07/24

// // Restaurant routes
// router.patch('/update-restaurant/:id', upload.array("images", 3), restaurantController.updateRestaurant); // 19/07/24
// router.delete('/delete-restaurant/:id', restaurantController.deleteRestaurant); // 18/07/24
// router.get('/get-restaurants', restaurantController.getRestaurants);
// router.get('/get-restaurant-details/:id', restaurantController.getRestaurantDetails); // 19/07/24
// // router.get('/search-restaurant', restaurantController.searchRestaurants);
// router.get('/get-restaurantBy-category', restaurantController.getRestaurantByCategory);

// // Category routes
router.post(
  "/add-cuisine",
  upload.fields([{ name: "image", maxCount: 1 }]),
  restaurantController.addCuisine
);
// router.get('/get-categories', restaurantController.getCategories); // 18/07/24

// // Coupon routes
// router.post('/add-coupon', restaurantController.addCoupon); // 18/07/24
// router.patch('/update-coupon/:id', restaurantController.updateCoupon); // 18/07/24
// router.delete('/delete-coupon/:id', restaurantController.deleteCoupon); // 18/07/24
// router.get('/get-coupons', restaurantController.getCoupons); // 18/07/24
// router.get('/get-coupon-details/:id', restaurantController.getCouponDetails); // 18/07/24

// // Product routes
// router.post('/add-product', upload.array("images", 3), restaurantController.addProduct); // 18/07/24
// router.patch('/update-product/:id', upload.array("images", 3), restaurantController.updateProduct); // 18/07/24
// router.delete('/delete-product/:id', restaurantController.deleteProduct); // 18/07/24
// router.get('/get-productsBy-restaurantId/:restaurantId', restaurantController.getProductsByRestaurantId); // 18/07/24
// router.get('/get-product-details/:id', restaurantController.getProductDetails); // 19/07/24

// // Review routes
// router.post('/add-review', restaurantController.addReview); //* 19/07/24 check this
// router.get('/get-restaurant-reviews', restaurantController.getRestaurantReviews); // 19/07/24
// router.get('/get-product-reviews/:productId', restaurantController.getProductReviews); // 19/07/24

// // Order routes
// router.get('/accept-order', restaurantController.acceptOrder); // 30/07/24
// router.get('/get-orders', restaurantController.getOrders); // 31/07/24
// router.post('/cancel-order/:orderId', restaurantController.cancelOrder); // 31/07/24

// // Complaint routes
// router.post('/add-complaint',restaurantController.addComplaint) // 21/08/24

module.exports = router;
