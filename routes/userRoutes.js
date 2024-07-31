const express = require("express");
const validate = require("../middlewares/validate");
const passport = require("passport");
require('../passport');

const router = express.Router();

router.use(passport.initialize());
router.use(passport.session());


const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const upload = require("../middlewares/imgUpload");


router.get("/get-otp", userController.getOTP);
router.post("/signup", authController.userSignup);

// Google Auth 
router.get('/google', passport.authenticate('google', {
    scope:
        ['email', 'profile']
}));

// Auth Callback 
router.get('/google/callback',
    passport.authenticate('google', {
        successRedirect: '/api/v1/user/successGoogleLogin',
        failureRedirect: '/api/v1/user/failureGoogleLogin',
        scope: ['email', 'profile']
    })
);

router.get('/successGoogleLogin', userController.successGoogleLogin);
router.get('/failureGoogleLogin', userController.failureGoogleLogin);


// Route to initiate Facebook OAuth authentication
router.get('/facebook', passport.authenticate('facebook', {
    scope: ['email']
}));

// Auth Callback
router.get('/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/successFacebookLogin',
        failureRedirect: '/failureFacebookLogin'
    })
);

// Success and failure routes
router.get('/successFacebookLogin', userController.successFacebookLogin);
router.get('/failureFacebookLogin', userController.failureFacebookLogin);


// autheniation
router.use(authController.authenicateUser);

router.get("/logout", userController.logout); // 20/07/24

// Address routes
router.get("/get-all-addresses", userController.getAddresses);
router.post("/add-address", userController.addAddress);
router.patch("/update-address", userController.updateAddress); // 31/07/24
router.delete('/remove-address', validate.validateFields, userController.removeAddress);

router.get('/get-restaurantNearUser', userController.getRestaurantsNearUser); // 18/07/24

// Profile routes
router.get('/get-user-profile', userController.getUserProfile); // 18/07/24
router.patch('/update-user-profile', upload.single("image"), userController.updateUserProfile); // 19/07/24


// Fav routes
router.post('/add-to-fav', userController.addToFav); // 19/07/24
router.post('/remove-from-fav', userController.removeFromFav); // 19/07/24
router.get('/get-user-favs', userController.getUserFav); // 19/07/24

// Review routes
router.post('/add-review', userController.addReview); // 19/07/24
router.get('/get-user-reviews', userController.getUserReviews); // 19/07/24

// Veg mode routes
router.post('/change-vegMode', userController.changeVegMode); // 19/07/24
router.get("/get-restaurantBy-vegMode", userController.getRestaurantByVegMode); // 19/07/24

// Cart routes
router.post('/add-to-cart', userController.addToCartOrIncreaseQty); // 19/07/24
router.post('/remove-from-cart', userController.removeFromCartOrDecreaseQty); // 19/07/24
router.get('/clear-cart', userController.clearCart); // 19/07/24
router.get('/get-cart-details', userController.getCartDetails); // 19/07/24

// Order routes
router.post('/place-order', userController.placeOrder); // 19/07/24
router.get('/get-user-orders', userController.getUserOrders); // 18/07/24
router.get('/get-order/:orderId', userController.getOrderDetails); // 31/07/24
router.post('/cancel-order/:orderId', userController.cancelOrder); // 31/07/24
router.get('/get-order-location/:orderId', userController.getOrderLocation); // 31/07/24
router.get('/apply-coupon', userController.applyCoupon); // 31/07/24

// Restaurant routes
router.get('/search-restaurantsAndDishes', userController.searchRestaurantsAndDishes); // 20/07/24
router.get('/filter-sort-restaurants', userController.filterAndSortRestaurants); // 25/07/24


module.exports = router;