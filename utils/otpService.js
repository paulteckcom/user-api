const sendOtp = async (phoneNumber) => {
    // Simulate sending OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`OTP sent to ${phoneNumber}: ${otp}`);
    return otp;
  };
  
  module.exports = { sendOtp };
  