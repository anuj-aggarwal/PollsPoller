// Require Node Modules
const express = require("express");
const path = require("path");
const bp = require("body-parser");

// Require User Files
const CONFIG = require("./config");
const models = require("./models");


//--------------------
//    Initialization
//--------------------
const app = express();


//--------------------
//   MiddleWares
//--------------------

// Set View Engine
app.set("view engine", "ejs");

// Use Body Parser
app.use(bp.urlencoded({extended:true}));
app.use(bp.json());


//--------------------
//  Request Handlers
//--------------------

// root Route
app.get("/", (req,res)=>{
    res.render("index");
});

// Login/Signup Page
app.get("/loginsignup", (req, res)=>{
    res.render("loginsignup");
});

// Signup Request
app.post("/signup", (req,res)=>{
    // Find the User if already exists
    models.User.find({
        username: req.body.username
    })
    .then((user)=>{
        // If user does not exists, create new User
        if(user.length === 0)
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
        res.redirect("/loginsignup");
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