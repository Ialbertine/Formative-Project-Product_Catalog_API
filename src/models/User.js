const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address"
      ]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    // NEW: Explicit isActive field
    isActive: {
      type: Boolean,
      default: true,  // New users are active by default
      required: true
    },
    profileImage: {
      type: String,
      default: "default-avatar.jpg"
    },
    phoneNumber: {
      type: String,
      match: [/^\+?[1-9]\d{9,14}$/, "Please enter a valid phone number"]
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    lastLogin: {
      type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // Optional: Track account activation details
    activationToken: {
      type: String,
      select: false
    },
    activationTokenExpires: {
      type: Date,
      select: false
    }
  },
  { timestamps: true }
);

// Existing pre-save and method hooks remain the same
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Updated to include isActive check
userSchema.methods.generateAuthToken = function() {
  // Only generate token if account is active
  if (!this.isActive) {
    throw new Error('Account is inactive');
  }
  
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      isActive: this.isActive 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

// Virtual for user's full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address || !this.address.street) return '';
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}, ${this.address.country}`;
});

// Methods for account activation management
userSchema.methods.generateActivationToken = function() {
  const activationToken = crypto.randomBytes(32).toString('hex');
  
  this.activationToken = crypto
    .createHash('sha256')
    .update(activationToken)
    .digest('hex');
  
  this.activationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return activationToken;
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);