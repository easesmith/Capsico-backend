const express = require("express");
const deliveryExecController = require("../controllers/deliveryExecController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", deliveryExecController.deliveryExecSignup); // 20/07/24
router.post("/login", authController.deliveryExecLogin); // 20/07/24


// autheniation
// router.use(authController.authenicateDeliveryExec);


router.get("/logout", deliveryExecController.logout); // 20/07/24

router.get("/me", deliveryExecController.getMe); // 20/07/24

module.exports = router;