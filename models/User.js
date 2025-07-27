const mongoose = require('mongoose');
const passportlocalmongoose = require("passport-local-mongoose");
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    profilePicture: {
  type: String,
  default: "/images/default-profile.png" // place this default image in public/images
},

    googleId: String,
    googleTokens: {
        accessToken: String,
        refreshToken: String,
        expiryDate: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


module.exports = mongoose.model('User', UserSchema);
