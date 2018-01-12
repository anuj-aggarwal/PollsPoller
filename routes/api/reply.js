// Create a new Express Router
const route = require("express").Router();

// Require the DB Models
const models = require('../../models');

// HELPERS
const {checkAPILoggedIn} = require('../../helpers');


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
        .then(reply => {
            // Send the replies to user
            res.send(reply.replies);
        })
        .catch(err => {
            console.log(err);
        })
});

// Post Request for adding new reply to existing reply
route.post('/:id/replies', checkAPILoggedIn, (req, res) => {
    // Create the new Reply
    models.Reply.create({
        sender: req.user._id,
        body: req.body.body
    })
        .then(innerReply => {
            console.log("Replied: " + innerReply);
            // Find the Outer Reply
            models.Reply.findById(req.params.id)
                .then(reply => {
                    // Add new reply to outer reply's replies
                    reply.replies.push(innerReply);
                    return reply.save();
                })
                .then(outerReply => {
                    // Populate the sender
                    return models.Reply.populate(innerReply, 'sender');
                })
                .then(innerReply => {
                    // Send the new reply to user
                    res.send(innerReply);
                })
        })
        .catch(err => {
            console.log(err);
        })
});

// PATCH Request to change body of a Reply
route.patch('/:id', checkAPILoggedIn, (req, res) => {
    // Find the Reply
    models.Reply.findById(req.params.id)
        .then(reply => {
            // If reply's author not the same as current user, ERROR
            if (reply.sender.toString() !== req.user._id.toString()) {
                res.send({err: "Can't Change other user's Reply!"});
                throw new Error("Invalid Access!!");
            }

            // else, If User is same as author, Update the reply
            reply.body = req.body.body;
            return reply.save();
        })
        .then(reply => {
            // Send the new Reply to User
            res.send(reply);
        })
        .catch(err => {
            console.log(err);
        });
});


// Function to delete a Reply and all its children
function deleteReplyAndChildren(replyId) {
    // Find the reply
    return models.Reply.findById(replyId)
        .then(reply => {
            // Delete Inner(Children) Replies
            let promises = reply.replies.map(reply => deleteReplyAndChildren(reply));
            return Promise.all(promises);
        })
        .then(() => {
            return models.Reply.findByIdAndRemove(replyId);
        })
        .then(reply => {
            console.log("Deleted: " + reply);
        })
}

// DELETE Request to delete a reply
route.delete('/:id', checkAPILoggedIn, (req, res) => {
    // Find id the reply is of user only
    models.Reply.findById(req.params.id)
        .select('sender')
        .then(reply => {
            if (reply.sender.toString() !== req.user._id.toString()) {
                res.send({err: "Can't Delete other user's reply"});
                throw Error("Invalid Access!!");
            }
        })
        .then(() => {
            // If reply is inner reply
            if (req.body.outerReplyId !== undefined) {
                // Find the outer Reply
                models.Reply.findById(req.body.outerReplyId)
                    .then(outerReply => {
                        // Remove the Reply from outerReply's replies
                        outerReply.replies = outerReply.replies.filter(reply => {
                            return (reply.toString() !== req.params.id);
                        });
                        return outerReply.save();
                    })
                    .then(() => {
                        // Delete the Reply from the database
                        return deleteReplyAndChildren(req.params.id);
                    })
                    .then(reply => {
                        // Send the deleted reply to user
                        res.send(reply);
                    })
                    .catch(err => {
                        console.log(err);
                    })
            }
            // else, if reply is outermost reply
            else {
                // Find the Poll
                models.Poll.findById(req.body.pollId)
                    .then(poll => {
                        // Remove the Reply from Poll's replies
                        poll.replies = poll.replies.filter(reply => {
                            return (reply.toString() !== req.params.id);
                        });
                        return poll.save();
                    })
                    .then(() => {
                        // Delete the Reply from the database
                        return deleteReplyAndChildren(req.params.id);
                    })
                    .then(reply => {
                        // Send the deleted reply to user
                        res.send(reply);
                    })
                    .catch(err => {
                        console.log(err);
                    })
            }
        })
        .catch(err => {
            console.log(err);
        });
});

// Export the Router
module.exports = route;