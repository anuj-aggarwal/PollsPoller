// Require Mongoose
const mongoose = require("mongoose");

// User Schema
const UserSchema = mongoose.Schema({
    username: String,
    password: String,
    name: String,
    email: String,
    pollsCreated: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "poll"
    }]
});

// Export User Model
module.exports = mongoose.model("user", UserSchema);