// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require('../models');


//--------------------
//       ROUTES
//--------------------

// GET Route for all polls of user page
route.get('/:id/polls/show', (req,res)=>{
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

// GET Route for all polls of User
route.get('/:id/polls', (req,res)=>{
    // Decide method for sorting(trending/recent/default)
    // from query parameter "sort"
    let sortBy;
    switch(req.query.sort) {
        case "recent":
            // recent sorted by last created
            sortBy = "createdAt";
            break;
        case "trending":
            // trending sorted by number of votes
            sortBy = "voteCount";
            break;
        case "default":
            // Default sorting by last updated
            sortBy = "updatedAt";
            break;
    }

    // Get all the polls with question, createdAt and voteCount only
    models.Poll.find({
        author: req.params.id
    }, 'question createdAt voteCount')
        // Sort the polls according to sorting method
        .sort({[sortBy]: 'descending'})
        .then((polls)=>{
            // Send the Polls to user
            res.send(polls);
        })
        .catch((err)=>{
            console.log(err);
        });
});

// Export the Router
module.exports = route;