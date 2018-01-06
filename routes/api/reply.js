// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require('../../models');


// Get request for all replies of a Reply
route.get('/:id/replies', (req, res) => {
    // Find the Outer Reply
    // Populate all replies to this reply and their senders
    models.Reply.findById(req.params.id)
        .populate({
            path: 'replies',
            populate: {
                path: 'sender'
            }
        })
        .then((reply) => {
            // Send the replies to user
            res.send(reply.replies);
        })
        .catch((err) => {
            console.log(err);
        })
});

// Post Request for adding new reply to existing reply
route.post('/:id/replies', (req,res)=>{
    // Create the new Reply
    models.Reply.create({
        sender: req.user._id,
        body: req.body.body
    })
        .then((innerReply)=>{
            console.log("Replied: " + innerReply);
            // Find the Outer Reply
            models.Reply.findById(req.params.id)
                .then((reply)=>{
                    // Add new reply to outer reply's replies
                    reply.replies.push(innerReply);
                    return reply.save();
                })
                .then((outerReply)=>{
                    // Populate the sender
                    return models.Reply.populate(innerReply, 'sender');
                })
                .then((innerReply)=>{
                    // Send the new reply to user
                    res.send(innerReply);
                })
        })
        .catch((err)=>{
            console.log(err);
        })
});

// Export the Router
module.exports = route;