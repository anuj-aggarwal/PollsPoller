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
        .then(() => {
	        console.log(`Database ${CONFIG.DB.NAME} Ready for Use!`);

	        // Delete Old Data present in Database
	        console.log("Deleting Old Data...");
	        return User.remove()
	                   .then(() => {
		                   return Poll.remove();
	                   })
	                   .then(() => {
		                   return Reply.remove();
	                   });
        })
        .then(() => {
	        console.log("Data Deleted successfully...");

	        // Start Seeding new Data
	        console.log("Starting Data Seeding.....");

	        // Create 5 Users each with 10 polls
	        console.log("Creating Users and Polls");
	        let promises = [];
	        for (let i = 0; i < 5; ++i) {
		        promises.push(createUserAndPolls(i));
	        }
	        return Promise.all(promises);
        })
        .then(() => {
	        console.log("Created Users and Polls successfully!");

	        // Close the connection with Database
	        mongoose.connection.close();
        })
        .catch(err => {
	        console.log(`Error Seeding Data: ${err}`);
        });


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
		           let promises = [];
		           for (let j = 0; j < 10; ++j) {
			           promises.push(Poll.create({
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

		           return Promise.all(promises);
	           });
}