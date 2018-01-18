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


// Export the Router
module.exports = route;