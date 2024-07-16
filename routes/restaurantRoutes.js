const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate");

const router = express.Router();


router.post("/add-restaurant", validate.validateFields, authController.addRestaurant);

router.get("/get-restaurants", restaurantController.getRestaurants);


module.exports = router;