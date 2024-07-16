const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const validate = require("../middlewares/validate");
const passport = require("passport");

const router = express.Router();

router.use(passport.initialize());
router.use(passport.session());

router.get("/get-otp", userController.getOTP);
router.post("/signup", authController.userSignup);

// Auth 
router.get('/google', passport.authenticate('google', {
    scope:
        ['email', 'profile']
}));

// Auth Callback 
router.get('/google/callback',
    passport.authenticate('google', {
        successRedirect: '/success',
        failureRedirect: '/failure'
    })
);

router.get('/success', userController.successGoogleLogin);

router.get('/failure', userController.failureGoogleLogin);


module.exports = router;