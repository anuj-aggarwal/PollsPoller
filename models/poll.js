// Require Mongoose
const mongoose = require("mongoose");

// Poll Schema
const pollSchema = mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    question: String,
    options: [{
        body: String,
        votes: Number
    }],
    voters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    discussion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "discussion"
    },
    category: String,
    pollType: String,
    isOpen: Boolean
});

// Export Poll Model
module.exports = mongoose.model("poll", pollSchema);