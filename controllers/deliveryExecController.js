const catchAsync = require("../utils/catchAsync");

exports.deliveryExecSignup = catchAsync(async (req, res, next) => {
    const { email, password, phone, type, address, location } = req.body;

    // Check if the email or phone already exists
    const existingExec = await DeliveryExec.findOne({ $or: [{ email }, { phone }] });
    if (existingExec) {
        return next(new AppError('Email or phone already in use.', 400));
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new delivery executive
    const newExec = await DeliveryExec.create({
        email,
        password: hashedPassword,
        phone,
        type,
        address,
        location
    });

    // Generate a JWT token
    const token = jwt.sign({ id: newExec._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    // Remove password from output
    newExec.password = undefined;

    res.status(201).json({
        success: true,
        token,
        data: {
            deliveryExec: newExec
        }
    });
});

exports.logout = catchAsync(async (req, res, next) => {
    res.cookie("token", "", { expires: new Date(0) });

    res.status(200).json({
        success: true,
        message: "Logout successfully!",
    });
});