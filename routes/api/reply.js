const httpStatusCodes = require("http-status-codes");
// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require("../../models");

// HELPERS
const { checkAPILoggedIn } = require("../../helpers");


// Get request for all replies of a Reply
route.get("/:id/replies", (req, res, next) => {
	// Find the Outer Reply
	// Populate all replies to this reply and their senders
	models.Reply.findById(req.params.id)
	      .populate({
		      path: "replies",
		      populate: {
			      path: "sender"
		      }
	      })
	      // Send the replies to user
	      .then(reply => {
		      if (!reply) {
			      let err = new Error("Reply does not exists!");
			      err.status = httpStatusCodes.NOT_FOUND;
			      return next(err);
		      }

		      res.send(reply.replies);
	      })
	      .catch(next);
});

// Post Request for adding new reply to existing reply
route.post("/:id/replies", checkAPILoggedIn, (req, res, next) => {
	if (!req.body.body) {
		let err = new Error("No Reply body!");
		err.status = httpStatusCodes.BAD_REQUEST;
		return next(err);
	}

	let outerReply;
	let innerReply;
	// Find the Outer Reply
	models.Reply.findById(req.params.id)
	      .then(reply => {
		      if (!reply) {
			      let err = new Error("Outer Reply not found!");
			      err.status = httpStatusCodes.NOT_FOUND;
			      return next(err);
		      }

		      outerReply = reply;
		      // Create the new Reply
		      return models.Reply.create({
			      sender: req.user._id,
			      body: req.body.body.toString()
		      });
	      })
	      .then(reply => {
		      innerReply = reply;
		      console.log("Replied: " + innerReply);

		      // Add new reply to outer reply's replies
		      outerReply.replies.push(innerReply);
		      return outerReply.save();
	      })
	      .then(outerReply => {
		      // Populate the sender
		      return models.Reply.populate(innerReply, "sender");
	      })
	      // Send the new reply to user
	      .then(innerReply => res.send(innerReply))
	      .catch(next);
});


// PATCH Request to change body of a Reply
route.patch("/:id", checkAPILoggedIn, (req, res, next) => {
	if (!req.body.body) {
		let err = new Error("Reply Body Required!");
		err.status = httpStatusCodes.BAD_REQUEST;
		return next(err);
	}

	// Find the Reply
	models.Reply.findById(req.params.id)
	      .then(reply => {
		      if (!reply) {
			      let err = new Error("Reply not found!!");
			      err.status = httpStatusCodes.NOT_FOUND;
			      return next(err);
		      }

		      // If reply's author not the same as current user, ERROR
		      if (reply.sender.toString() !== req.user._id.toString()) {
			      let err = new Error("Can't change other Users Reply!!");
			      err.status = httpStatusCodes.UNAUTHORIZED;
			      return next(err);
		      }

		      // else, If User is same as author, Update the reply
		      reply.body = req.body.body.toString();
		      return reply.save();
	      })
	      // Send the new Reply to User
	      .then(reply => res.send(reply))
	      .catch(next);
});


// Function to delete a Reply and all its children
function deleteReplyAndChildren(replyId) {
	// Find the reply
	return models.Reply.findById(replyId)
	             .then(reply => {
		             if (!reply)
			             throw new Error(`Reply with id: ${replyId} not found!`);

		             // Delete Inner(Children) Replies
		             let promises = reply.replies.map(reply => deleteReplyAndChildren(reply));
		             return Promise.all(promises);
	             })
	             .then(() => {
		             return models.Reply.findByIdAndRemove(replyId);
	             })
	             .then(reply => console.log("Deleted: " + reply));
}

// DELETE Request to delete a reply
route.delete("/:id", checkAPILoggedIn, (req, res, next) => {
	if ((!req.body.outerReplyId && !req.body.pollId) || (req.body.outerReplyId && req.body.pollId)) {
		let err = new Error("Invalid Body!");
		err.status = httpStatusCodes.BAD_REQUEST;
		return next(err);
	}

	// Find id the reply is of user only
	models.Reply.findById(req.params.id)
	      .select("sender")
	      .then(reply => {
		      if (!reply) {
			      let err = new Error(`Reply with id: ${req.params.id} not found!`);
			      err.status = httpStatusCodes.NOT_FOUND;
			      return next(err);
		      }

		      if (reply.sender.toString() !== req.user._id.toString()) {
			      let err = new Error("Can't Delete other User's Reply!");
			      err.status = httpStatusCodes.UNAUTHORIZED;
			      return next(err);
		      }
	      })
	      .then(() => {
		      // If reply is inner reply
		      if (req.body.outerReplyId !== undefined) {
			      // Find the outer Reply
			      models.Reply.findById(req.body.outerReplyId.toString())
			            .then(outerReply => {
				            if (!outerReply) {
					            let err = new Error("Outer Reply not found!!");
					            err.status = httpStatusCodes.NOT_FOUND;
					            return next(err);
				            }

				            // Remove the Reply from outerReply's replies
				            outerReply.replies = outerReply.replies.filter(reply => (reply.toString() !== req.params.id));
				            return outerReply.save();
			            })
			            // Delete the Reply from the database
			            .then(() => deleteReplyAndChildren(req.params.id))
			            // Send the deleted reply to user
			            .then(reply => res.send(reply))
			            .catch(next);
		      }
		      // else, if reply is outermost reply
		      else {
			      // Find the Poll
			      models.Poll.findById(req.body.pollId.toString())
			            .then(poll => {
				            if (!poll) {
					            let err = new Error("Poll does not exists!");
					            err.status = httpStatusCodes.NOT_FOUND;
					            return next(err);
				            }

				            // Remove the Reply from Poll's replies
				            poll.replies = poll.replies.filter(reply => (reply.toString() !== req.params.id));
				            return poll.save();
			            })
			            // Delete the Reply from the database
			            .then(() => deleteReplyAndChildren(req.params.id))
			            // Send the deleted reply to user
			            .then(reply => res.send(reply));
		      }
	      })
	      .catch(next);
});

// Export the Router
module.exports = route;