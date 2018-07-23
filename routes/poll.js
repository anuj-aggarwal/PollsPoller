const httpStatusCodes = require("http-status-codes");

// Require the DB Models
const models = require("../models");

// HELPERS
const { checkLoggedIn } = require("../helpers");

//--------------------
//       ROUTES
//--------------------

module.exports = (route, io) => {
	// GET Route for a page of all polls
	route.get("/", (req, res, next) => {
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
		models.Poll.count()
			.then(c => {
				count = c;

				numPages = Math.ceil(count / perPage);

				// If page out of limits, render last page
				if (page > numPages)
					page = numPages;

				// Get all the polls with question, author and voteCount only
				return models.Poll.find({}, "question author voteCount tags")
				// Sort the polls according to sorting method
							.sort({ [sortBy]: "descending" })
							// Skip and limit to get desired range
							.skip(perPage * (page - 1))
							.limit(perPage)
							// Populate the username of the author
							.populate("author", "username")
			})
			// Send the Polls to user
			.then(polls => {
				res.render("polls", {
					polls,
					page,
					perPage,
					pages: numPages,
					sort: req.query.sort
				});
			})
			.catch(next);
	});


	// GET Route for New Poll Page
	route.get("/new", checkLoggedIn, (req, res) => {
		res.render("newpoll");
	});


	// GET Route for Single Poll
	route.get("/:id", (req, res, next) => {
		// Find the Poll with specified id in params
		models.Poll.findById(req.params.id).populate("author")
			.then(poll => {
				// If poll not found
				if (!poll) {
					let err = new Error("Poll does not exists!!");
					err.status = httpStatusCodes.NOT_FOUND;
					return next(err);
				}

				// If user logged in
				// Find the Vote of current user
				let optionVoted;
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
			.catch(next);
	});


	// POST Route to Vote
	route.post("/:id/votes", checkLoggedIn, (req, res, next) => {
		// Find the Poll
		models.Poll.findById(req.params.id)
			.then(poll => {
				if (!poll) {
					let err = new Error("Poll does not exists!");
					err.status = httpStatusCodes.NOT_FOUND;
					return next(err);
				}

				// If request does not contain a valid option
				// Find option to vote in poll's options
				let matchedOptions = poll.options.filter(option => (option._id.toString() === req.body.option));
				if(matchedOptions.length === 0) {
					let err = new Error("Not a Valid Option!!");
					err.status = httpStatusCodes.UNPROCESSABLE_ENTITY;
					return next(err);
				}

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
			// Redirect user to the poll's page
			.then(poll => {
				// Emit new Vote Count
				io.emit("vote count", poll.votes.length);
				// Reload the page
				res.redirect(`/polls/${req.params.id}`);
			})
			.catch(next);
	});

	return route;
};