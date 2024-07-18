const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate");
const upload = require('../middlewares/imgUpload');

const router = express.Router();

// Restaurant routes
router.post('/add-restaurant', authController.addRestaurant);
router.patch('/update-restaurant/:id', restaurantController.updateRestaurant); // 18/07/24
router.delete('/delete-restaurant/:id', restaurantController.deleteRestaurant); // 18/07/24
router.get('/get-restaurants', restaurantController.getRestaurants);
router.get('/search-restaurant', restaurantController.searchRestaurants);
router.get('/get-restaurantBy-category', restaurantController.getRestaurantByCategory);
router.post("/get-restaurantBy-vegMode", authController.authenicateUser, restaurantController.getRestaurantByVegMode); // 18/07/24 remain

// Category routes
router.post('/add-category', upload.array("images", 3), restaurantController.addCategory);
router.get('/get-categories', restaurantController.getCategories); // 18/07/24

// Coupon routes
router.post('/add-coupon', restaurantController.addCoupon); // 18/07/24
router.patch('/update-coupon/:id', restaurantController.updateCoupon); // 18/07/24
router.delete('/delete-coupon/:id', restaurantController.deleteCoupon); // 18/07/24
router.get('/get-coupons', restaurantController.getCoupons); // 18/07/24
router.get('/get-coupon-details/:id', restaurantController.getCouponDetails); // 18/07/24

// Product routes
router.post('/add-product', upload.array("images", 3), restaurantController.addProduct); // 18/07/24
router.patch('/update-product/:id', upload.array("images", 3), restaurantController.updateProduct); // 18/07/24
router.delete('/delete-product/:id', restaurantController.deleteProduct); // 18/07/24
router.get('/get-productsBy-restaurantId/:restaurantId', restaurantController.getProductsByRestaurantId); // 18/07/24

module.exports = router; 