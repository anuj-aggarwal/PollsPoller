// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require('../models');


//--------------------
//       ROUTES
//--------------------

// GET Route for Discussion Page
route.get('/:pollId', (req, res) => {
    // Find the Poll with specified id in params
    models.Poll.findById(req.params.pollId)
        .then((poll) => {
            // If found, Render the Discussion Page
            res.render('discussion', {poll});
        })
        .catch((err) => {
            // Else redirect User to Index Page
            console.log("Error: " + err);
            res.redirect('/');
        });
});


// Export the Router
module.exports = route;