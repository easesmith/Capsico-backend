const mongoose = require("mongoose");

const userOtpLinkSchema = new mongoose.Schema(
  {

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    otp: {
      type: Number,
    },
    otpExpiresAt:{
        type: Date,
    },
  },
  { timestamps: true }
);

const UserOtpLink = mongoose.model("UserOtpLink", userOtpLinkSchema);
module.exports = UserOtpLink;