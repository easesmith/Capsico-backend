const express = require("express");
const deliveryExecController = require("../controllers/deliveryExecController");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", deliveryExecController.deliveryExecSignup); // 20/07/24
router.post("/login", authController.deliveryExecLogin); // 20/07/24


// autheniation
// router.use(authController.authenicateDeliveryExec);


router.get("/logout", deliveryExecController.logout); // 20/07/24

router.get("/assign-order", deliveryExecController.assignOrderToDeliveryExec); // 30/07/24
router.get("/get-assigned-order", deliveryExecController.getassignedOrderOfDeliveryExec) // 30/07/24
router.get("/accept-order", deliveryExecController.acceptOrder) // 30/07/24
router.post("/cancel-order", deliveryExecController.cancelOrder) // 30/07/24
router.get("/complete-order", deliveryExecController.completeOrder) // 31/07/24
router.post("/update-order-location/:orderId", deliveryExecController.updateOrderLocation) // 31/07/24

// Complaint routes
router.post('/add-complaint',deliveryExecController.addComplaint) // 21/08/24

module.exports = router;