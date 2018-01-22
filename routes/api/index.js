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
	res.status(404).send({ err: "Page not Found!!" });
});


// Export the Router
module.exports = route;