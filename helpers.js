// Check Logged in for Routes
function checkLoggedIn(req, res, next) {
	if (req.user)
		next();
	else {
		console.log("Invalid Access!!");
		res.redirect("/");
	}
}

// Check Logged in for API
function checkAPILoggedIn(req, res, next) {
	if (req.user)
		next();
	else {
		console.log("Invalid Access!!");
		res.send({ err: "User not logged in!!" });
	}
}

// Export Helpers
module.exports = { checkLoggedIn, checkAPILoggedIn };