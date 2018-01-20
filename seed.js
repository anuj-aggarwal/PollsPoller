// Require Mongoose
const mongoose = require("mongoose");

// Require DB Models
const User = require("./models/user");
const Poll = require("./models/poll");
const Reply = require("./models/reply");

// Require config.js file
const CONFIG = require("./config");

// Use global Promise instead of Mongoose's which is deprecated
mongoose.Promise = global.Promise;

// Connect to MongoDB Server
mongoose.connect(`mongodb://${CONFIG.DB.HOST}:${CONFIG.DB.PORT}/${CONFIG.DB.NAME}`, {
	useMongoClient: true
})
        // Delete Old Data
        .then(() => {
	        console.log(`Database ${CONFIG.DB.NAME} Ready for Use!`);
	        return clearDB();
        })
        // Start Seeding New Data
        .then(() => {
	        return seedDB(5, 10);
        })
        // Close the Connection
        .then(() => {
	        mongoose.connection.close();
        })
        // Handle Errors
        .catch(err => {
	        console.log(`Error Seeding Data: ${err}`);
        });


// Function to clear the Database
function clearDB() {
	console.log("Deleting Old Data...");
	return User.remove()
	           .then(() => {
		           return Poll.remove();
	           })
	           .then(() => {
		           return Reply.remove();
	           })
	           .then(() => {
		           console.log("Data Deleted successfully...");
	           });
}


// Function to seed the Database with numUsers Users and numPolls Polls
// Uses: createUsersAndPolls(), createRepliesOnPolls(), createRepliesOnReplies(), createPollsVotes()
function seedDB(numUsers, numPolls) {
	console.log("Starting Data Seeding.....");
	// Create Users and Their Polls
	return createUsersAndPolls(numUsers, numPolls)
	// Create Replies on each Poll by each User
		.then(() => {
			return createRepliesOnPolls();
		})
		// Create Replies on each Reply by each User
		.then(() => {
			return createRepliesOnReplies();
		})
		// Create Votes on Polls randomly
		.then(() => {
			return createPollsVotes();
		})
		.then(() => {
			console.log("Finished Seeding.....!!");
		});
}

// Function to create numUsers Users and their numPolls Polls
// Returns a promise which resolves when all Users and their Polls are created
// Uses: createUserAndPolls()
function createUsersAndPolls(numUsers, numPolls) {
	console.log("Creating Users and Polls...");

	let userPromises = [];
	for (let i = 0; i < numUsers; ++i) {
		userPromises.push(createUserAndPolls(i, numPolls));
	}
	return Promise.all(userPromises)
	              .then(() => {
		              console.log(`Created ${numUsers} Users and ${numPolls} Polls successfully!`);
	              });
}

// Function to create a User and all its polls
// returns a promise which resolves when user and all its polls are created
function createUserAndPolls(i, numPolls) {
	// Create the User
	return User.create({
		username: `User${i}`,
		password: `User${i}`,
		name: `User ${i}`,
		email: `user${i}@gmail.com`
	})
	           .then(user => {
		           // Create all polls of User
		           let pollPromises = [];
		           for (let j = 0; j < numPolls; ++j) {
			           pollPromises.push(Poll.create({
				           author: user._id,
				           question: `Poll Question ${i}.${j}`,
				           // Set votes for each option to 0
				           options: [
					           { body: "1", votes: 0 },
					           { body: "2", votes: 0 },
					           { body: "3", votes: 0 },
					           { body: "4", votes: 0 },
					           { body: "5", votes: 0 }
				           ],
				           voteCount: 0,
				           isPollOpen: true,
				           isDiscussionOpen: true
			           }));
		           }

		           return Promise.all(pollPromises);
	           });
}


// Function to Create Replies on each poll by each User
// Returns a promise which resolves when all replies are created
// Uses: createPollReplies()
function createRepliesOnPolls() {
	console.log("Creating Replies on Polls.....");
	// Find all polls
	return Poll.find()
	           .then(polls => {
		           // Create Reply by each User on the Poll using createPollReplies()
		           let promises = polls.map(poll => createPollReplies(poll));
		           return Promise.all(promises);
	           })
	           .then(() => {
		           console.log("Replies on Polls created successfully!");
	           });
}


// Function to add Replies to a poll
// Returns a promise which resolves when all Replies are created on the poll
function createPollReplies(poll) {
	// Find all Users
	return User.find()
	           .then(users => {
		           // Create a Reply on the Poll for each User
		           let replyPromises = users.map(user => {
			           return Reply.create({
				           sender: user._id,
				           body: `Reply By ${user.username}`
			           });
		           });
		           return Promise.all(replyPromises);
	           })
	           .then(replies => {
		           // Update the Poll with replies' ids
		           // Add the new reply to poll's Replies
		           replies.forEach(reply => poll.replies.push(reply._id));
		           return poll.save();
	           });
}


// Function to Create Replies on each Reply by each User
// Returns a promise which resolves when all replies are created
// Uses: createReplyReplies()
function createRepliesOnReplies() {
	console.log("Creating Replies on Replies.....");
	// Find all Replies
	return Reply.find()
	            .then(replies => {
		            // Create Reply by each User on the Reply using createReplyReplies()
		            let promises = replies.map(reply => createPollReplies(reply));
		            return Promise.all(promises);
	            })
	            .then(() => {
		            console.log("Replies on Replies created successfully!");
	            });
}


// Function to add Replies to a reply
// Returns a promise which resolves when all Replies are created on the reply
function createReplyReplies(outerReply) {
	// Find all Users
	return User.find()
	           .then(users => {
		           // Create a Reply on the Reply for each User
		           let replyPromises = users.map(user => {
			           return Reply.create({
				           sender: user._id,
				           body: `Reply By ${user.username}`
			           });
		           });
		           return Promise.all(replyPromises);
	           })
	           .then(replies => {
		           // Update the Outer Reply with replies' ids
		           // Add the new reply to Outer Reply's Replies
		           replies.forEach(reply => outerReply.replies.push(reply._id));
		           return outerReply.save();
	           });
}


// Function to create Random Votes on all the polls
// Returns a Promise which resolves when all votes are added
// Uses: createPollVotes()
function createPollsVotes() {
	console.log("Voting on Polls.....");

	// Find All Users
	let users;
	return User.find()
	           // Get all Polls
	           .then(_users => {
		           users = _users;
		           return Poll.find();
	           })
	           .then(polls => {
		           // For each poll, create new Votes
		           let promises = polls.map(poll => {
			           return createPollVotes(poll, users);
		           });
		           return Promise.all(promises);
	           })
	           .then(() => {
		           console.log("Completed Voting on Polls!");
	           });
}

// Function to Vote on a Poll
// Returns a Promise which resolves when voting on the poll is done
function createPollVotes(poll, users) {
	// For each User,
	for (user of users) {
		// Create Random Number to decide if current User has to poll on this poll
		if (Math.round(Math.random()) === 1) {
			// Vote on random option of the Poll
			poll.votes.push({
				voter: user._id,
				option: poll.options[Math.floor(Math.random() * poll.options.length)]._id
			});
		}
	}
	// Update Votes Count
	poll.voteCount = poll.votes.length;
	// Save the Poll
	return poll.save();
}