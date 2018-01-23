const httpStatusCodes = require("http-status-codes");
// Create a new Express Router
const route = require("express").Router();

// Require SubRoutes
const discussion = require("./discussion");
const poll = require("./poll");
const reply = require("./reply");


// Use SubRoutes
route.use("/discussions", discussion);
route.use("/polls", poll);
route.use("/replies", reply);


// 404 ROUTES
// Generic Route for all other API Routes: Sends 404 Error
route.use("/", (req, res) => {
	res.status(httpStatusCodes.NOT_FOUND).send({ err: httpStatusCodes.getStatusText(httpStatusCodes.NOT_FOUND) });
});

// ----------------------
// Error handling Routes
// ----------------------

route.use((err, req, res, next) => {
	console.error(err.stack);

	// If Response already sent, don't send it again and move forward
	if (res.headersSent)
		return;

	// Handling 4xx Errors: Render 400 page
	if (err.status && Math.floor(err.status / 100) === 4) {
		res.status(err.status).send({
			err: err.message
		});
	}
	else {
		// Internal Server Error if no Error Code Stated
		err.status = err.status || httpStatusCodes.INTERNAL_SERVER_ERROR;

		// Handling other Errors(5xx): Render 500 Errors Page
		res.status(err.status).send({
			err: err.message
		});
	}
});


// Export the Router
module.exports = route;