// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require("../models");

// HELPERS
const { checkLoggedIn } = require("../helpers");

//--------------------
//       ROUTES
//--------------------

// GET Route for all polls of User
route.get("/:id/polls", checkLoggedIn, (req, res) => {
	// Check if current user is not the same as Requesting User
	if (req.user._id.toString() !== req.params.id) {
		console.log("Invalid Access!!");
		res.redirect("/");
	}

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
		default:
			// Default sorting by last updated
			sortBy = "updatedAt";
			break;
	}

	const page = parseInt(req.query.page) || 1;
	const perPage = parseInt(req.query.perPage) || 1;

	let polls;

	// Get all the polls with question, createdAt and voteCount only
	models.Poll.find({
		author: req.params.id
	}, "question createdAt voteCount")
	// Sort the polls according to sorting method
	      .sort({ [sortBy]: "descending" })
	      // Skip and limit to get the desired Range
	      .skip(perPage * (page - 1))
	      .limit(perPage)
	      .then(_polls => {
		      polls = _polls;
		      return models.Poll.count({ author: req.params.id });
	      })
	      // Render the User Polls page
	      .then(count => {
		      res.render("userpolls", {
			      polls,
			      page,
			      perPage,
			      pages: Math.ceil(count / perPage),
			      sort: req.query.sort
		      });
	      })
	      .catch(console.log);
});


// Export the Router
module.exports = route;