//--------------------
//    NODE MODULES
//--------------------
const express = require("express");
const path = require("path");
const bp = require("body-parser");
const cp = require("cookie-parser");
const session = require("express-session");


//--------------------
//    User Files
//--------------------
const CONFIG = require("./config");
const models = require("./models");
const Passport = require("./passport");


//--------------------
//    INITIALIZATION
//--------------------
const app = express();


//--------------------
//    MIDDLEWARES
//--------------------

// Set View Engine
app.set("view engine", "ejs");

// Use Body Parser
app.use(bp.urlencoded({extended:true}));
app.use(bp.json());

// Use Cookie-Parser
app.use(cp(CONFIG.COOKIE_SECRET_KEY));
// Express-Session for Passport
app.use(session({
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Initialize Passport
app.use(Passport.initialize());
app.use(Passport.session());



//--------------------
//    HELPERS
//--------------------

function checkLoggedIn(req, res, next){
    if(req.user)
        next();
    else{
        console.log("Invalid Access!!");
        res.redirect("/");
    }
}


// Serve static files
app.use('/', express.static(path.join(__dirname, 'public_static')));

//--------------------
//  REQUEST HANDLERS
//--------------------

app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});

// Routers
app.use('/polls', require('./routes/poll'));
app.use('/discussions', require('./routes/discussion'));
app.use('/users', require('./routes/user'));
app.use('/api', require('./routes/api'));

// root Route
app.get("/", (req,res)=>{
    res.render("index");
});

// Login/Signup Page
app.get("/loginsignup", (req, res)=>{
    res.render("loginsignup");
});

// Use passport Authenticate at Login POST Route
app.post("/login", Passport.authenticate('local', {
    successRedirect: "/",
    failureRedirect: "/loginsignup"
}));

// Get Route for Logging Out
app.get('/logout', (req,res)=>{
    req.logout();
    res.redirect('/');
});

// Signup POST Request
app.post("/signup", (req,res, next)=>{
    // Find the User if already exists
    models.User.findOne({
        username: req.body.username
    })
    .then((user)=>{
        // If user does not exists, create new User
        if(user === null)
            return models.User.create({
                username: req.body.username,
                password: req.body.password,
                name: req.body.name,
                email: req.body.email
            });
        // Otherwise throw error if user exists
        else
            throw Error("User already Exists");
    })
    .then((user)=>{
        // Redirect to Login/SignUp Page
        console.log("User created: ");
        console.log(user);

        // Log the current user in
        Passport.authenticate('local', {
            successRedirect: "/",
            failureRedirect: "/loginsignup"
        })(req,res, next);

    })
    .catch((err)=>{
        // Redirect to Home Page
        console.log(err);
        res.redirect("/");
    });
});


// Listen at specified Port
app.listen(CONFIG.SERVER.PORT, ()=>{
    console.log(`Server started at http://${CONFIG.SERVER.HOST}:${CONFIG.SERVER.PORT}/`);
});