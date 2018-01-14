// Create a new Express Router
const route = require("express").Router();

// Require SubRoutes
const user = require("./user");
const discussion = require("./discussion");
const poll = require("./poll");
const reply = require("./reply");


// Use SubRoutes
route.use("/users", user);
route.use("/discussions", discussion);
route.use("/polls", poll);
route.use("/replies", reply);

// Export the Router
module.exports = route;