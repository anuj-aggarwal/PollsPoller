// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require("../models");

// HELPERS
const { checkLoggedIn } = require("../helpers");

//--------------------
//       ROUTES
//--------------------

// GET Route for all polls Page
route.get("/", (req, res) => {

	// Decide method for sorting(trending/recent/default)
	// from query parameter "sort"
	let sortBy;
	switch (req.query.sort) {
		case "recent":
			// recent sorted by last created
			sortBy = "createdAt";
			break;
		case "trending":
			// trending sorted by number of votes
			sortBy = "voteCount";
			break;
		case "default":
			// Default sorting by last updated
			sortBy = "updatedAt";
			break;
	}

	// Get all the polls with question, author and voteCount only
	models.Poll.find({}, "question author voteCount")
	// Sort the polls according to sorting method
	      .sort({ [sortBy]: "descending" })
	      // Populate the username of the author
	      .populate("author", "username")
	      // Send the Polls to user
	      .then(polls => {
		      res.render("polls", { polls });
	      })
	      .catch(console.log);
});


// GET Route for New Poll Page
route.get("/new", checkLoggedIn, (req, res) => {
	res.render("newpoll");
});


// GET Route for Single Poll
route.get("/:id", (req, res) => {
	// Find the Poll with specified id in params
	models.Poll.findById(req.params.id).populate("author")
	      .then(poll => {

		      // Find the Vote of current user
		      let optionVoted;
		      // If user logged in
		      if (req.user) {
			      // Find user's vote
			      let vote = poll.votes.filter(vote => {
				      return (vote.voter.toString() === req.user._id.toString());
			      });
			      // If already voted
			      if (vote.length > 0)
				      optionVoted = vote[0].option.toString();
		      }

		      // If found, Render the Poll Page
		      res.render("poll", { poll, optionVoted });
	      })
	      .catch(err => {
		      // Else redirect User to Index Page
		      console.log("Error: " + err);
		      res.redirect("/");
	      });
});


// POST Route to Vote
route.post("/:id/votes", checkLoggedIn, (req, res) => {
	// Find the Poll
	models.Poll.findById(req.params.id)
	      .then(poll => {
		      // Find if User has already Voted on the Poll
		      let vote = poll.votes.filter(vote => {
			      // Compare the ids of vote and user Id
			      // toString() used to avoid Object Comparison
			      if (vote.voter.toString() === req.user._id.toString())
				      return true;
		      });

		      // If user hasn't already voted
		      if (vote.length === 0) {
			      // Add user to votes Array of poll
			      poll.votes.push({
				      voter: req.user._id,
				      option: req.body.option
			      });
			      // Increase a vote of options vote count
			      poll.options.forEach(option => {
				      if (option._id.toString() === req.body.option)
					      ++option.votes;
			      });
			      // Increase total votes of the Poll
			      ++poll.voteCount;
			      return poll.save();
		      }
		      // else, if user has already voted
		      else {
			      // Decrease a vote for previous options
			      // Increase a vote for new option
			      // Handles the case of voting on same option
			      poll.options.forEach(option => {
				      if (option._id.toString() === req.body.option)
					      ++option.votes;
				      if (option._id.toString() === vote[0].option.toString())
					      --option.votes;
			      });
			      // Change vote of the User to new Option
			      poll.votes.forEach(vote => {
				      if (vote.voter.toString() === req.user._id.toString())
					      vote.option = req.body.option;
			      });
			      // Update the DB
			      return poll.save();
		      }
	      })
	      // Redirect user to the polls page
	      // TODO: Redirect to some other page depending on further use
	      .then(poll => res.redirect(`/polls/${req.params.id}`))
	      .catch(err => {
		      // Redirect user to the polls page
		      // TODO: Redirect to some other page depending on further use
		      console.log(err);
		      res.redirect(`/polls/${req.params.id}`);
	      });
});


// Export the Router
module.exports = route;