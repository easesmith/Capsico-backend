const admin = require("firebase-admin");

const serviceAccount = require("../config/push-notification-key.json");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

exports.sendPushNotification = catchAsync(async (req, res, next) => {
    try {
        let message = {
            notification: {
                title: "Test Notification",
                body: "Notification Message"
            },
            data: {
                orderId: 123456,
                orderDate: "2024-08-20"
            },
            token: req.body.token
        }

        const response = await admin.messaging().send(message);
        res.status(200).send({
            success: true,
            message: "Notification sent successfully",
            response
        });

    } catch (error) {
        return next(new AppError("Notification failed", 500));
    }
})
