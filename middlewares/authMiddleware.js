const jwt = require('jsonwebtoken');
const User = require("../models/userModel.js");

exports.authenticate = async (req, res, next) => {
  const authHeader= req.headers['authorization']  
  let token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token." });
  }

  try {
    // 1️⃣ Decode the JWT
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);
    console.log("Decoded Token:", decoded);

    // 2️⃣ Find the user and exclude password
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("User not found in database");
      return res.status(401).json({ message: "User not found." });
    }

    // 3️⃣ Check if the password was changed after the token was issued
    if (user.passwordChangedAfterTokenIssued(decoded.iat)) {
      console.log("User changed password after token was issued");
      return res.status(401).json({ message: "Password changed. Please log in again." });
    }

    // 4️⃣ Attach user to request and proceed
    req.user = user;
    console.log("Authenticated User:", req.user);
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(401).json({ message: "Not authorized, token failed." });
  }
};

