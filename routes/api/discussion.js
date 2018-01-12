// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require('../../models');

// HELPERS
const {checkAPILoggedIn} = require('../../helpers');

//--------------------
//       ROUTES
//--------------------

// POST Route for Replying to Discussion(not to another reply)
route.post('/:pollId/replies', checkAPILoggedIn, (req, res) => {
    // Find the poll to reply on
    models.Poll.findById(req.params.pollId)
        .then(poll => {
            // Create new Reply
            let reply = models.Reply.create({
                sender: req.user._id,
                body: req.body.body
            })
                .then(reply => {
                    // Add the new reply to poll's Replies
                    poll.replies.push(reply._id);
                    poll.save()
                        // Find the newly Added Reply
                        // Populate the Sender
                        .then(poll => models.Reply.findById(reply._id).populate('sender'))
                        // Send the New populated Reply to the User
                        .then(reply => res.send(reply));
                });
        })
        .catch(err => {
            // Else redirect User to Index Page
            console.log("Error: " + err);
            res.send({err:"Unable to Reply"});
        });
});


// Get Route for All Replies of a Discussion
route.get('/:pollId/replies', (req, res) => {
    // Find the Poll
    // Populate the Replies and sender of each Reply
    models.Poll.findById(req.params.pollId)
        .populate({
            path: 'replies',
            populate: {
                path: 'sender'
            }
        })
        // Send the replies to the user
        .then(poll => res.send(poll.replies.slice(parseInt(req.query.skip), parseInt(req.query.skip) + parseInt(req.query.limit))))
        .catch(err => {
            // Log the Error and Redirect to Home Page
            console.log(err);
            res.redirect({err:"Unable to Retrieve Replies"});
        })
});


// Export the Router
module.exports = route;