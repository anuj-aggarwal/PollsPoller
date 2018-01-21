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
route.post("/", checkAPILoggedIn, (req, res) => {
	// Create a new Poll
	models.Poll.create({
		author: req.user._id,
		question: req.body.question,
		// Set votes for each option to 0
		options: req.body.options.map(option => {
			return {
				body: option,
				votes: 0
			};
		}),
		voteCount: 0,
		isPollOpen: true,
		isDiscussionOpen: true
	})
	// Send the new Poll's Address to the User
	      .then(poll => res.send(`/polls/${poll._id}`))
	      .catch(err => {
		      // If error, redirect on the Same Page
		      console.log(`Error! ${err}`);
		      res.send("/polls/new");
	      });
});


// Delete Route for Poll
route.delete("/:id", checkAPILoggedIn, (req, res) => {
	let replies = [];

	// Find the Poll
	models.Poll.findById(req.params.id)
	      .then(poll => {
		      // If Author is the same as Current User
		      if (poll.author.toString() !== req.user._id.toString()) {
			      res.send({ err: "Can't Delete Other User's Poll" });
			      throw new Error("Invalid Access!");
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
	      .catch(console.log);
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
		             // Delete Inner(Children) Replies
		             let promises = reply.replies.map(reply => deleteReplyAndChildren(reply));
		             return Promise.all(promises);
	             })
	             .then(() => {
		             return models.Reply.findByIdAndRemove(replyId);
	             })
	             .then(reply => console.log("Deleted: " + reply));
}


// Export the Router
module.exports = route;