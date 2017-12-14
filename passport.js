// Require Node Modules
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

// Require DB Models
const models = require("./models");

// Serialize User to username
passport.serializeUser((user, done)=>{
    done(null, user.username);
});

// Deserisalize User from username
passport.deserializeUser((username, done)=>{
    models.User.findOne({
        username
    })
    .then((user)=>{
        done(null, user);
    })
    .catch((err)=>{
        done(err);
    })
});


// Create local Strategy
const localStrategy = new LocalStrategy((username, password, done)=>{
    // Find is User exists
    models.User.findOne({
        username
    })
    .then((user)=>{
        // If User does not exists
        if(user===null)
            return done(null, false, {message: "User not found!"});
        // If Password does not match with found User
        if(user.password !== password)
            return done(null, false, {message: "Password Incorrect!!"});
        // Otherwise, we are done.....User found!!
        return done(null, user);
    })
    .catch((err)=>{
        // Log the Error and call done
        console.log("ERROR");
        done(err);
    })
});

// Make passport to use localStrategy at 'local'
passport.use('local', localStrategy);


// Export passport
module.exports = passport;