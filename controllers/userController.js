const User= require("../models/userModel");
const validator = require('validator');
const jwt =require('jsonwebtoken')
const {promisify}=require('util')
const env= require('dotenv');


const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id); // use helper
  
    res.status(statusCode).json({
      status: "success",
      token: `Bearer ${token}`, // optional to prefix here or later
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
          // Do not include password
        }
      }
    });
  
    return token;
};



exports.signup = async (req, res) => {
    console.log("Request Body from signup backend:", req.body); // Add this line to inspect the body
    const { 
        firstName, 
        lastName, 
        email, 
        password, 
        passwordConfirm, 
        birthdate, 
        sex, 
        height, 
        weight, 
        targetWeight,
        activityLevel, 
        fitnessGoal, 
        dietaryPreferences,
    } = req.body;
      
    try {
    // Check if email is already in use
    const emailCheck = await User.findOne({ email });
    if (emailCheck) {
        return res.status(409).json({ message: "Email already in use." });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid Email." });
    }

    // Create a new user instance
    const newUser = new User({
        firstName,
        lastName,
        email,
        password,
        passwordConfirm,
        birthdate,
        sex,
        height,
        weight,
        targetWeight,
        activityLevel,
        fitnessGoal,
        dietaryPreferences,
    });

    // Explicitly validate the document
    await newUser.validate();

    // ✅ Log passwordChangedAt for debugging
    console.log("passwordChangedAt on signup:", newUser.passwordChangedAt);

    // Save the user to the database
    await newUser.save();

    // Send response with token
    //signing up and logging in the user
    createSendToken(newUser, 201, res);
    } catch (err) {
    // Handle validation errors
    if (err.name === "ValidationError") {
        return res.status(400).json({ message: err.message });
    }
    // Handle other errors
    res.status(500).json({ message: err.message });
    console.error("Error in signup:", err);
    }
};


exports.login= async(req,res)=>{
    console.log("Login route hit");  // Log to see if the route is hit
    try{
        const {email,password}= req.body;
        const user = await User.findOne({ email }).select("+password");
        //user not signedup
        if (!user){
            return res.status (404).json({ message: "User not found" })
        }

        //if password is not correct

        if (!(await user.checkPassword(password,user.password))){
            return res.status(401).json({message:"Incorrect Email or Password"})

        }

        //if login is successfull , set user's token

        createSendToken(user, 200, res)
        console.log("lOGGED IN")


    }catch(err)
    {console.log(err)

    }
}


exports.logout = async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true, // Corrected the typo here
        expires: new Date(0),
    });

    console.log("Logged out")
    res.status(200).json({ message: "Logged out successfully" });
};



exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, passwordConfirm } = req.body;

        // 1️⃣ Validate input
        if (!currentPassword || !newPassword || !passwordConfirm) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (newPassword !== passwordConfirm) {
            return res.status(400).json({ message: "New passwords do not match." });
        }

        // 2️⃣ Get the logged-in user from DB (include password for verification)
        const user = await User.findById(req.user._id).select("+password");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // 3️⃣ Use checkPassword method from user model to verify current password
        const isMatch = await user.checkPassword(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect current password." });
        }

        // 4️⃣ Set the new password (pre-save middleware will handle hashing)
        user.password = newPassword;
        user.passwordChangedAt = Date.now(); // Invalidate old tokens

        await user.save();

        res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Server error while updating password." });
    }
};

  


//Profile Details
exports.getCurrentUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password"); // Exclude password

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User profile retrieved successfully.",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                birthdate: user.birthdate,
                sex: user.sex,
                height: user.height,
                weight: user.weight,
                targetWeight: user.targetWeight,
                activityLevel: user.activityLevel,
                fitnessGoal: user.fitnessGoal,
                dietaryPreferences: user.dietaryPreferences,
                caloriesRecommended: user.caloriesRecommended,
                proteinRecommended: user.proteinRecommended,
                createdAt: user.createdAt,
            },
        });
        
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateCurrentUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Update only the provided fields (keep existing values if not provided)
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.email = req.body.email || user.email;
        user.birthdate = req.body.birthdate || user.birthdate;
        user.sex = req.body.sex || user.sex;
        user.height = req.body.height || user.height;
        user.weight = req.body.weight || user.weight;
        user.targetWeight = req.body.targetWeight || user.targetWeight;
        user.activityLevel = req.body.activityLevel || user.activityLevel;
        user.fitnessGoal = req.body.fitnessGoal || user.fitnessGoal;
        user.dietaryPreferences = req.body.dietaryPreferences || user.dietaryPreferences;
        user.caloriesRecommended= req.body.caloriesRecommended || user.caloriesRecommended;
        user.proteinRecommended= req.body.proteinRecommended || user.proteinRecommended;

        // ✅ Save updated user data to the database
        const updatedUser = await user.save();

        // ✅ Return updated user profile (without password)
        res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                birthdate: updatedUser.birthdate,
                sex: updatedUser.sex,
                height: updatedUser.height,
                weight: updatedUser.weight,
                targetWeight: updatedUser.targetWeight,
                activityLevel: updatedUser.activityLevel,
                fitnessGoal: updatedUser.fitnessGoal,
                dietaryPreferences: updatedUser.dietaryPreferences,
                caloriesRecommended: updatedUser.caloriesRecommended,
                proteinRecommended: updatedUser.proteinRecommended,
                createdAt: updatedUser.createdAt,
            },
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Server error while updating profile" });
    }
};

exports.deleteAccount = async (req, res) => {
    try {

        
      const { currentPassword } = req.body;
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required." });
      }
  
      // Fetch the user from the database (ensure password is selected)
      const user = await User.findById(req.user.id).select("+password");
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      // Use checkPassword method instead of bcrypt.compare()
      const isMatch = await user.checkPassword(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password. Account deletion failed." });
      }
  
      // Delete the user
      await User.findByIdAndDelete(req.user.id);
  
      res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong.", error });
    }
};


  