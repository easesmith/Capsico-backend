const express = require("express");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require('path')
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const session = require("express-session");
const passport = require("passport");
const restaurantRouter = require("./routes/restaurantRoutes");
const deliveryExecRouter = require("./routes/deliveryExecRoutes");
const notificationRouter = require("./routes/notificationRoutes");

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1000,
    message: "Too many requests from this IP, please try again later.",
});

const app = express();

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
}));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "build")));
app.use(express.static(path.resolve("./public")));
app.use(
    cors({
        origin: process.env.FRONT_END_URL, // Specify the allowed origin
        credentials: true, // Allow including credentials in cross-origin requests
    })
);


app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(passport.initialize());
app.use(passport.session());

// Apply the rate limiter to all requests
// app.use(limiter);


const userRouter = require("./routes/userRoutes");

app.use("/api/v1/user", userRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/deliveryExec", deliveryExecRouter);
app.use("/api/v1/notification", notificationRouter);


// app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "build", "index.html"));
// });

app.use(globalErrorHandler);

module.exports = app;