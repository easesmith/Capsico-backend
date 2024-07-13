const axios = require("axios");
const User = require("../models/userModel");
const UserOtpLink = require("../models/userOtpLinkModel");

exports.sendOtpSms = async (phone) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    await axios.get(
      `https://manage.txly.in/vb/apikey.php?apikey=rqn4QrMoja5bae29&senderid=corprc&templateid=1707171264587322686&number=${phone}&message= ${otp} is your OTP For Login in Capsico, OTP is only valid for 10 mins do not share it with anyone.`
    );

    const expirationTimeframe = 5 * 60 * 1000; // 5 minutes in milliseconds
    const currentTime = new Date(); // Current time
    const otpExpiresAt = new Date(currentTime.getTime() + expirationTimeframe);
    const existingOtpDoc = await UserOtpLink.findOne({
      phone,
    });

    if (existingOtpDoc) {
      existingOtpDoc.otp = otp;
      existingOtpDoc.otpExpiresAt = otpExpiresAt;

      await existingOtpDoc.save();
    } else {
      await UserOtpLink.findOneAndDelete({ phone });
      const otpDoc = new UserOtpLink({
        phone,
        otp: otp,
        otpExpiresAt: otpExpiresAt,
      });

      await otpDoc.save();
    }
  } catch (err) {
    console.log(err);
  }
};

exports.verifyOtpSms = async (phone, enteredOTP, res) => {
  const otpDoc = await UserOtpLink.findOne({ phone }).lean();

  if (enteredOTP * 1 !== otpDoc.otp) {
    return res
      .status(400)
      .json({ success: false, message: "OTP does not match" });
  }

  const currentTime = new Date().getTime(); // Current time
  if (currentTime > otpDoc.otpExpiresAt.getTime()) {
    return res
      .status(400)
      .json({ success: false, message: "OTP has expired!" });
  }
  otpDoc.otp = null;
};
