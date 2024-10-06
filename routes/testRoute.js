const express = require("express");
const restaurantController = require("../controllers/testController");
// const authController = require("../controllers/authController");
const upload = require("../middlewares/imgUpload");

const router = express.Router();

// ... existing routes ...

// New Food-related routes
router.post(
  "/add-product",
  upload.array("images", 3),
  restaurantController.createFood
);
router.post("/create-variation", restaurantController.createVariation);
router.post("/create-addon", restaurantController.createAddOn);
router.post("/create-customization", restaurantController.createCustomization);
router.post(
  "/create-customization-option",
  restaurantController.createCustomizationOption
);
router.post("/create-category", restaurantController.createCategory);
router.patch("/update-category/:id", restaurantController.updateCategory);
router.delete("/delete-category/:id", restaurantController.deleteCategory);
router.get(
  "/category-tree/:restaurantId",
  restaurantController.getCategoryTree
);

// Menu routes
router.post("/create-menu", restaurantController.createMenu);
router.patch("/update-menu/:id", restaurantController.updateMenu);
router.get("/menu/:restaurantId", restaurantController.getMenu);

module.exports = router;
