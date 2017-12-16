// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require('../models');


//--------------------
//       ROUTES
//--------------------

// GET Route for New Poll Page
route.get('/new', (req,res)=>{
    res.render('newpoll');
});


// POST Route for Creating new Event
route.post('/', (req,res)=>{
    // Create a new Event
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
        isOpen: true
    })
    .then((poll) => {
        // If successful, create a discussion page for the Event
        models.Discussion.create({
            poll: poll._id,
            isOpen: true
        })
        .then((discussion)=>{
            // Update the Poll with the new Discussion Id
            poll.discussion = discussion._id;
            return poll.save();
        })
        .then((poll)=>{
            // Send the new Poll's Address to the User
            res.send(`/polls/${poll._id}`);
        })
    })
    .catch((err) => {
        // If error, log it, and redirect on the Same Page
        console.log(`Error! ${err}`);
        res.send('/polls/new');
    })
});


// GET Route for Single Poll
route.get('/:id', (req, res)=>{
    // Find the Poll with specified id in params
    models.Poll.findById(req.params.id)
    .then((poll)=>{
        // If found, Render the Poll Page
        res.render('poll', {poll});
    })
    .catch((err)=>{
        // Else redirect User to Index Page
        console.log("Error: " + err);
        res.redirect('/');
    });
});


// Export the Router
module.exports = route;