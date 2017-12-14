// Require Mongoose
const mongoose = require("mongoose");

// Discussion Schema
const discussionSchema = mongoose.Schema({
    poll: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "poll"
    },
    posts: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        },
        body: String,
        replies: [{
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user"
            },
            body: String
        }]
    }],
    isOpen: Boolean
});

// Export Discussion Model
module.exports = mongoose.model("discussion", discussionSchema);