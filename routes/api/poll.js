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

// POST Route for Creating new Poll
route.post("/", checkAPILoggedIn, (req, res, next) => {
	if (!req.body.question || !req.body.options) {
		let err = new Error("Poll Body Incomplete!!");
		err.status = httpStatusCodes.BAD_REQUEST;
		return next(err);
	}
	if (!(req.body.options instanceof Array)) {
		let err = new Error("Options must be an Array!!");
		err.status = httpStatusCodes.BAD_REQUEST;
		return next(err);
	}

	// Create a new Poll
	models.Poll.create({
		author: req.user._id,
		question: req.body.question.toString(),
		// Set votes for each option to 0
		options: req.body.options.map(option => {
			return {
				body: option.toString(),
				votes: 0
			};
		}),
		voteCount: 0,
		isPollOpen: true,
		isDiscussionOpen: true
	})
	// Send the new Poll's Address to the User
	      .then(poll => res.send(`/polls/${poll._id}`))
	      .catch(next);
});


// Delete Route for Poll
route.delete("/:id", checkAPILoggedIn, (req, res, next) => {
	let replies = [];

	// Find the Poll
	models.Poll.findById(req.params.id)
	      .then(poll => {
		      // If poll not found
		      if (!poll) {
			      let err = new Error("Poll does not exists!!");
			      err.status = httpStatusCodes.NOT_FOUND;
			      return next(err);
		      }

		      // If Author is not the same as Current User
		      if (poll.author.toString() !== req.user._id.toString()) {
			      let err = new Error("Can't Delete Other User's Poll");
			      err.status = httpStatusCodes.UNAUTHORIZED;
			      return next(err);
		      }

		      // Save the Replies of User for Delete
		      replies = poll.replies;

		      // Delete the Poll
		      return poll.remove();
	      })
	      // Send the Poll to user
	      .then(poll => {
		      console.log(`Deleted: ${poll}`);
		      res.send(poll);
	      })
	      // Remove all replies with their Children Replies
	      .then(() => {
		      return deleteReplyAndChildren(replies);
	      })
	      .then(() => {
		      console.log("Successfully Deleted all replies of Poll: " + req.params.id);
	      })
	      .catch(next);
});


// Function to Delete all Replies in replies and their Children Replies
// Uses: deleteReplyAndChildren()
function deleteReplies(replies) {
	let promises = [];

	// For each reply, Delete it with its children Replies
	replies.forEach(reply => promises.push(deleteReplyAndChildren(reply)));

	return Promise.all(promises);
}

// Function to delete a Reply and all its children
function deleteReplyAndChildren(replyId) {
	// Find the reply
	return models.Reply.findById(replyId)
	             .then(reply => {
		             // If Reply not found
		             if (!reply) {
			             throw new Error(`Reply with id: ${replyId} does not exists`);
		             }

		             // Delete Inner(Children) Replies
		             let promises = reply.replies.map(reply => deleteReplyAndChildren(reply));
		             return Promise.all(promises);
	             })
	             .then(() => {
		             return models.Reply.findByIdAndRemove(replyId);
	             })
	             .then(reply => {
		             console.log("Deleted: " + reply);
		             return reply;
	             });
}


// Export the Router
module.exports = route;