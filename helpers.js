const httpStatusCodes = require("http-status-codes");

// Check Logged in for Routes
function checkLoggedIn(req, res, next) {
	if (req.user)
		next();
	else {
		let err = new Error("You must be logged in to do that!");
		err.status = httpStatusCodes.UNAUTHORIZED;
		return next(err);
	}
}

// Check Logged in for API
function checkAPILoggedIn(req, res, next) {
	if (req.user)
		next();
	else {
		let err = new Error("Your must be logged in to do that!");
		err.status = httpStatusCodes.UNAUTHORIZED;
		return next(err);
	}
}

// Export Helpers
module.exports = { checkLoggedIn, checkAPILoggedIn };