// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require('../models');

// HELPERS
const {checkLoggedIn} = require('../helpers');

//--------------------
//       ROUTES
//--------------------

// GET Route for all polls of user page
route.get('/:id/polls', checkLoggedIn, (req,res)=>{
    // Check sorting method and render userpolls.ejs accordingly
    if(req.query.sort) {
        res.render('userpolls', {
            sortBy: req.query.sort
        });
    }
    else {
        res.render('userpolls', {
            sortBy: "default"
        });
    }
});

// Export the Router
module.exports = route;