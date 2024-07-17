const express = require("express");
const validate = require("../middlewares/validate");
const passport = require("passport");
require('../passport');

const router = express.Router();

router.use(passport.initialize());
router.use(passport.session());


const userController = require("../controllers/userController");
const authController = require("../controllers/authController");


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

// Addresses routes
router.get("/get-all-addresses", authController.authenicateUser, userController.getAddresses);
router.post("/add-address", authController.authenicateUser, userController.addAddress);
router.delete('/remove-address', authController.authenicateUser, validate.validateFields, userController.removeAddress);

router.get('/get-restaurantNearYou',userController.getRestaurantsNearUser);


module.exports = router;