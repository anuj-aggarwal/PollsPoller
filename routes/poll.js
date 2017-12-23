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


// POST Route for Creating new Poll
route.post('/', (req,res)=>{
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


// GET Route for Single Poll
route.get('/:id', (req, res)=>{
    // Find the Poll with specified id in params
    models.Poll.findById(req.params.id).populate('author')
    .then((poll)=>{
        // If found, Render the Poll Page
        console.log(poll);
        res.render('poll', {poll});
    })
    .catch((err)=>{
        // Else redirect User to Index Page
        console.log("Error: " + err);
        res.redirect('/');
    });
});


// POST Route to Vote
route.post('/:id/votes', (req,res)=>{
    // Find the Poll
    models.Poll.findById(req.params.id)
    .then((poll)=>{
        // Find if User has already Voted on the Poll
        let vote = poll.votes.filter((vote)=>{
            // Compare the ids of vote and user Id
            // toString() used to avoid Object Comparison
            if(vote.voter.toString()===req.user._id.toString())
                return true;
        });

        // If user hasn't already voted
        if(vote.length === 0){
            // Add user to votes Array of poll
            poll.votes.push({
                voter: req.user._id,
                option: req.body.option
            });
            // Increase a vote of options vote count
            poll.options.forEach((option)=>{
                if(option._id.toString()===req.body.option)
                    ++option.votes;
            });
            // Increase total votes of the Poll
            ++poll.voteCount;
            return poll.save();
        }
        // else, if user has already voted
        else{
            // Decrease a vote for previous options
            // Increase a vote for new option
            // Handles the case of voting on same option
            poll.options.forEach((option)=>{
                if(option._id.toString()===req.body.option)
                    ++option.votes;
                if(option._id.toString() === vote[0].option.toString())
                    --option.votes;
            });
            // Change vote of the User to new Option
            poll.votes.forEach((vote)=>{
                if(vote.voter.toString() ===req.user._id.toString())
                    vote.option = req.body.option;
            });
            // Update the DB
            return poll.save();
        }
    })
    .then((poll)=>{
        // Redirect user to the polls page
        // TODO: Redirect to some other page depending on further use
        res.redirect(`/polls/${req.params.id}`);
    })
    .catch((err)=>{
        // Redirect user to the polls page
        // TODO: Redirect to some other page depending on further use
        console.log(err);
        res.redirect(`/polls/${req.params.id}`);
    });
});


// Export the Router
module.exports = route;