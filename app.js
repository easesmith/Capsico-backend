const express = require("express");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require('path')
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1000,
    message: "Too many requests from this IP, please try again later.",
});

const app = express();

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "build")));
app.use(
    cors({
        origin: process.env.FRONT_END_URL, // Specify the allowed origin
        credentials: true, // Allow including credentials in cross-origin requests
    })
);

// Test middleware
// app.use((req, res, next) => {
//     console.log('test middleware');
//     req.requestTime = new Date().toISOString();
//     next();
// });

// Apply the rate limiter to all requests
// app.use(limiter);


app.use("/api/v1/user", userRouter);


// app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "build", "index.html"));
// });

app.use(globalErrorHandler);

module.exports = app;