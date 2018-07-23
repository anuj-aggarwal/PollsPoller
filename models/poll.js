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
	votes: [{
		voter: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "user"
		},
		option: {
			type: mongoose.Schema.Types.ObjectId
		}
	}],
	voteCount: Number,
	replies: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "reply"
	}],
	pollType: String,
	isPollOpen: Boolean,
	isDiscussionOpen: Boolean,
	tags: [ String ]
}, {
	usePushEach: true,  // Use Mongo $pushEach instead of deprecated $pushAll
	timestamps: { createdAt: "createdAt" }    // adds createdAt and updatedAt timestamps for sorting
});

// Export Poll Model
module.exports = mongoose.model("poll", pollSchema);