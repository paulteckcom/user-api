const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { sendOtp, verifyOtp } = require("../utils/otpService");

// Register
exports.register = async (req, res) => {
  const { fullName, phoneNumber, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, phoneNumber, password: hashedPassword });

    const otp = await sendOtp(phoneNumber);  // Function to send OTP
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    res.status(201).json({ message: "User registered, OTP sent." });
  } catch (error) {
    res.status(500).json({ error: "Registration failed." });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { phoneNumber, otp } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });
    if (user && user.otp === otp && user.otpExpires > Date.now()) {
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      res.json({ message: "OTP verified, user is now verified." });
    } else {
      res.status(400).json({ error: "Invalid or expired OTP." });
    }
  } catch (error) {
    res.status(500).json({ error: "OTP verification failed." });
  }
};

// Login
exports.login = async (req, res) => {
  const { phoneNumber, password } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ token, message: "Logged in successfully." });
    } else {
      res.status(401).json({ error: "Invalid credentials." });
    }
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
};

// Forgot Password (send OTP)
exports.forgotPassword = async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });
    if (!user) return res.status(404).json({ error: "User not found." });

    const otp = await sendOtp(phoneNumber);
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();
    res.json({ message: "OTP sent to reset password." });
  } catch (error) {
    res.status(500).json({ error: "Failed to send OTP." });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { phoneNumber, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });
    if (user && user.otp === otp && user.otpExpires > Date.now()) {
      user.password = await bcrypt.hash(newPassword, 10);
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      res.json({ message: "Password reset successfully." });
    } else {
      res.status(400).json({ error: "Invalid or expired OTP." });
    }
  } catch (error) {
    res.status(500).json({ error: "Password reset failed." });
  }
};
