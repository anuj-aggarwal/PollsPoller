// Require Mongoose
const mongoose = require("mongoose");

// Reply Schema
const replySchema = mongoose.Schema({
	sender: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user"
	},
	body: String,
	replies: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "reply"
	}]
}, {
	usePushEach: true   // Use Mongo $pushEach instead of deprecated $pushAll
});

// Export Reply Model
module.exports = mongoose.model("reply", replySchema);