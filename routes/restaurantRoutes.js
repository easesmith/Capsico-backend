const express = require("express");
const restaurantController = require("../controllers/restaurantController");
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate");
const upload = require('../middlewares/imgUpload');

const router = express.Router();


router.post("/add-restaurant", authController.addRestaurant);

router.get("/get-restaurants", restaurantController.getRestaurants);
router.get("/search-restaurant", restaurantController.searchRestaurants);
router.post('/add-category', upload.single("image"), restaurantController.addCategory);
router.get('/get-restaurantBy-category',restaurantController.getRestaurantByCategory);



module.exports = router;