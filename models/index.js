// Require Mongoose
const mongoose = require("mongoose");

// Require DB Models
const User = require("./user");
const Poll = require("./poll");
const Reply = require("./reply");

// Require config.js file
const CONFIG = require("../config");


// Use global Promise instead of Mongoose's which is deprecated
mongoose.Promise = global.Promise;


// Connect to MongoDB Server
mongoose.connect(`mongodb://${CONFIG.DB.HOST}:${CONFIG.DB.PORT}/${CONFIG.DB.NAME}`, {
    useMongoClient: true
})
.then(()=>{
    console.log(`Database ${CONFIG.DB.NAME} Ready for Use!`);
})
.catch((err)=>{
    console.log(`Error connecting to Database: ${err}`);
});


// Export all the Models
module.exports = {User, Poll, Reply};