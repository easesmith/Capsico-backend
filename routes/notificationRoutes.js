const express = require("express");
const pushNotificationController = require("../controllers/pushNotificationController");

const router = express.Router();

router.post("/send-notification", pushNotificationController.sendPushNotification); // 20-08-2024

module.exports = router;