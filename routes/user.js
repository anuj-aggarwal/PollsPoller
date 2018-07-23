const httpStatusCodes = require("http-status-codes");
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
route.get("/:id/polls", checkLoggedIn, (req, res, next) => {
	// Check if current user is not the same as Requesting User
	if (req.user._id.toString() !== req.params.id) {
		let err = new Error("Can't See Other User's Polls");
		err.status = httpStatusCodes.UNAUTHORIZED;
		return next(err);
	}

	const DEFAULT_PER_PAGE = 10;

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

	// Find page, perPage and handle non-positive values
	let page = Math.max(parseInt(req.query.page) || 1, 1);
	let perPage = Math.max(parseInt(req.query.perPage) || 1, DEFAULT_PER_PAGE);
	let count;
	let numPages;

	// Get count of Polls
	models.Poll.count({ author: req.params.id })
	      .then(c => {
		      count = c;

		      numPages = Math.ceil(count / perPage);

		      // If page out of limits, render last page
		      if (page > numPages)
			      page = numPages;

		      // Get all the polls with question, createdAt and voteCount only
		      return models.Poll.find({
			      author: req.params.id
		      }, "question createdAt voteCount tags")
		      // Sort the polls according to sorting method
		                   .sort({ [sortBy]: "descending" })
		                   // Skip and limit to get
		                   // the desired Range
		                   .skip(perPage * (page - 1))
		                   .limit(perPage);
	      })
	      // Render the User Polls page
	      .then(polls => {
		      res.render("userpolls", {
			      polls,
			      page,
			      perPage,
			      pages: numPages,
			      sort: req.query.sort
		      });
	      })
	      .catch(next);
});


// Export the Router
module.exports = route;