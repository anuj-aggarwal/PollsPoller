// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require('../models');


//--------------------
//       ROUTES
//--------------------

// GET Route for Discussion Page
route.get('/:pollId', (req, res)=>{
    // Find the Poll with specified id in params
    models.Poll.findById(req.params.pollId)
        .then((poll)=>{
            // If found, Render the Discussion Page
            res.render('discussion', {poll});
        })
        .catch((err)=>{
            // Else redirect User to Index Page
            console.log("Error: " + err);
            res.redirect('/');
        });
});

// POST Route for Replying to Discussion(not to another reply)
route.post('/:pollId/replies', (req,res)=>{
    // Find the poll to reply on
    models.Poll.findById(req.params.pollId)
    .then((poll)=>{
        // Create new Reply
        models.Reply.create({
            sender: req.user._id,
            body: req.body.body
        })
        .then((reply)=>{
            // Add the new reply to poll's Replies
            poll.replies.push(reply._id);
            return poll.save();
        })
        .then((poll)=>{
            // Redirect to Discussion Page if succesfully Replied
            res.redirect(`/discussions/${poll._id}`);
        })
    })
    .catch((err)=>{
        // Else redirect User to Index Page
        console.log("Error: " + err);
        res.redirect('/');
    });
});



// Export the Router
module.exports = route;