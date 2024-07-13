const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const validate = require("../middlewares/validate");

const router = express.Router();

router.get("/get-otp",userController.getOTP);
router.post("/signup", validate.validateFields, authController.userSignup);


module.exports = router;