const mongoose= require("mongoose");
const Schema= mongoose.Schema;
const bcrypt = require('bcrypt');



const userSchema = new mongoose.Schema(
{
  firstName: {
    type: String,
    required: [true, "Please enter your first name"],
    minLength: 3,
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Please enter your last name"],
    minLength: 3,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    required: [true, "Please enter your email"],
  },
  password: {
    type: String,
    minLength: 8,
    required: [true, "Please enter your password"],
    select: false, 
  },
  
  passwordConfirm: {
    type: String,
    required: function () {
      return this.isNew; // Required only when creating a new user
    },
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "Passwords do not match!",
    },
  },
  
  passwordChangedAt: Date,
  role: {
    type: String,
    default: "user",
    enum: ["admin", "user"],
  },
},
{ timestamps: true }
);

// ✅ Hash Password Before Saving & Remove `passwordConfirm`
userSchema.pre("save", async function (next) {
try {
  if (!this.isModified("password")) return next();

  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);

  // Remove the passwordConfirm field from the document
  this.passwordConfirm=undefined;

  next();
} catch (err) {
  next(err);
}
});
  userSchema.methods.checkPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
  };
  

  userSchema.methods.passwordChangedAfterTokenIssued = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
      const passwordChangeTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
      return passwordChangeTime > JWTTimestamp;
    }
    return false;
  };

  // ✅ Set PasswordChangedAt Only After It's Modified
  userSchema.pre("save", async function (next) {
    try {
      if (!this.isModified("password") || this.isNew) return next();
    
      // Add a Password Changed Field
      this.passwordChangedAt= Date.now() - 1000;
    
      next();
    } catch (err) {
      next(err);
    }

  });


  
  module.exports = mongoose.model("User", userSchema);



