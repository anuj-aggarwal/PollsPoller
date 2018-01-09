// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require('../../models');

// HELPERS
const {checkAPILoggedIn} = require('../../helpers');

//--------------------
//       ROUTES
//--------------------

// GET Route for all polls
route.get('/', (req,res)=>{
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

    // Get all the polls with question, author and voteCount only
    models.Poll.find({}, 'question author voteCount')
    // Sort the polls according to sorting method
        .sort({[sortBy]: 'descending'})
        // Populate the username of the author
        .populate('author', 'username')
        .then((polls)=>{
            // Send the Polls to user
            res.send(polls);
        })
        .catch((err)=>{
            console.log(err);
        });
});


// POST Route for Creating new Poll
route.post('/', checkAPILoggedIn, (req,res)=>{
    // Create a new Poll
    models.Poll.create({
        author: req.user._id,
        question: req.body.question,
        // Set votes for each option to 0
        options: req.body.options.map((option)=>{
            return {
                body: option,
                votes: 0
            };
        }),
        voteCount: 0,
        isPollOpen: true,
        isDiscussionOpen: true
    })
        .then((poll)=>{
            // Send the new Poll's Address to the User
            res.send(`/polls/${poll._id}`);
        })
        .catch((err)=>{
            // If error, redirect on the Same Page
            console.log(`Error! ${err}`);
            res.send('/polls/new');
        });
});


// Export the Router
module.exports = route;