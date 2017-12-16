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
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "reply"
    }],
    category: String,
    pollType: String,
    isPollOpen: Boolean,
    isDiscussionOpen: Boolean
});

// Export Poll Model
module.exports = mongoose.model("poll", pollSchema);