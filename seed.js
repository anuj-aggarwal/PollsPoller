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

	        console.log("Deleting Old Data...");
	        return User.remove()
	                   .then(() => {
		                   return Poll.remove();
	                   })
	                   .then(() => {
		                   return Reply.remove();
	                   });
        })
        // Start Seeding New Data
        // Create Users and Their Polls
        .then(() => {
	        console.log("Data Deleted successfully...");

	        // Start Seeding new Data
	        console.log("Starting Data Seeding.....");

	        return createUsersAndPolls();
        })
        // Create Replies on each Poll by each User
        .then(() => {
	        console.log("Created Users and Polls successfully!");

	        console.log("Starting Creation of Replies.....");
	        return createRepliesOnPolls();
        })
        // Create Replies on each Reply by each User
        .then(() => {
	        return createRepliesOnReplies();
        })
        // Close the Connection
        .then(() => {
	        console.log("Replies created successfully!");

	        console.log("Finished Seeding");
	        // Close the connection with Database
	        mongoose.connection.close();
        })
        // Handle Errors
        .catch(err => {
	        console.log(`Error Seeding Data: ${err}`);
        });


// Function to create Users and their Polls
// Returns a promise which resolves when all Users and their Polls are created
// Uses: createUserAndPolls()
function createUsersAndPolls() {
	// Create 5 Users each with 10 polls
	console.log("Creating Users and Polls");
	let userPromises = [];
	for (let i = 0; i < 5; ++i) {
		userPromises.push(createUserAndPolls(i));
	}
	return Promise.all(userPromises);
}

// Function to create a User and all its polls
// returns a promise which resolves when user and all its polls are created
function createUserAndPolls(i) {
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
		           for (let j = 0; j < 10; ++j) {
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
	// Find all polls
	return Poll.find()
	           .then(polls => {
		           // Create Reply by each User on the Poll using createPollReplies()
		           let promises = polls.map(poll => createPollReplies(poll));
		           return Promise.all(promises);
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
	// Find all Replies
	return Reply.find()
	           .then(replies => {
		           // Create Reply by each User on the Reply using createReplyReplies()
		           let promises = replies.map(reply => createPollReplies(reply));
		           return Promise.all(promises);
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