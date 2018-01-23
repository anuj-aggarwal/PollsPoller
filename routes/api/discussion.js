const httpStatusCodes = require("http-status-codes");
// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require("../../models");

// HELPERS
const { checkAPILoggedIn } = require("../../helpers");

//--------------------
//       ROUTES
//--------------------

// POST Route for Replying to Discussion(not to another reply)
route.post("/:pollId/replies", checkAPILoggedIn, (req, res, next) => {
	// Find the poll to reply on
	models.Poll.findById(req.params.pollId)
	      .then(poll => {
		      if (!poll) {
			      let err = new Error("Poll does not exists!!");
			      err.status = httpStatusCodes.NOT_FOUND;
			      return next(err);
		      }

		      // Create new Reply
		      let reply = models.Reply.create({
			      sender: req.user._id,
			      body: req.body.body
		      })
		                        .then(reply => {
			                        // Add the new reply to poll's Replies
			                        poll.replies.push(reply._id);
			                        poll.save()
			                            // Find the newly Added Reply
			                            // Populate the Sender
			                            .then(poll => models.Reply.findById(reply._id).populate("sender"))
			                            // Send the New populated Reply to the User
			                            .then(reply => res.send(reply));
		                        });
	      })
	      .catch(next);
});


// Get Route for All Replies of a Discussion
route.get("/:pollId/replies", (req, res, next) => {
	let skip = parseInt(req.query.skip);
	if(isNaN(skip) || skip < 0) {
		let err = new Error("Invalid skip value");
		err.status = httpStatusCodes.BAD_REQUEST;
		return next(err);
	}
	let limit = parseInt(req.query.limit);
	if(isNaN(limit) || limit < 0) {
		let err = new Error("Invalid limit value");
		err.status = httpStatusCodes.BAD_REQUEST;
		return next(err);
	}

	// Find the Poll
	// Populate the Replies and sender of each Reply
	models.Poll.findById(req.params.pollId)
	      .populate({
		      path: "replies",
		      populate: {
			      path: "sender"
		      }
	      })
	      // Send the replies to the user
	      .then(poll => {
		      if (!poll) {
			      let err = new Error("Poll does not exists!!");
			      err.status = httpStatusCodes.NOT_FOUND;
			      return next(err);
		      }

		      res.send(poll.replies.slice(skip, skip + limit));
	      })
	      .catch(next);
});


// Export the Router
module.exports = route;