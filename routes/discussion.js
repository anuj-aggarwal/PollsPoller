const httpStatusCodes = require("http-status-codes");
// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require("../models");


//--------------------
//       ROUTES
//--------------------

// GET Route for Discussion Page
route.get("/:pollId", (req, res, next) => {
	// Find the Poll with specified id in params
	models.Poll.findById(req.params.pollId)
	// If found, Render the Discussion Page
	      .then(poll => {
		      // If poll not found, Error(404)
		      if (!poll) {
			      let err = new Error("Poll not Found!");
			      err.status = httpStatusCodes.NOT_FOUND;
			      return next(err);
		      }
		      // else, Render the Discussion Page
		      res.render("discussion", { poll });
	      })
	      .catch(next);
});


// Export the Router
module.exports = route;