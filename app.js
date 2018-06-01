//--------------------
//    NODE MODULES
//--------------------
const express = require("express");
const path = require("path");
const bp = require("body-parser");
const cp = require("cookie-parser");
const session = require("express-session");
const httpStatusCodes = require("http-status-codes");
const http = require("http");
const socketIO = require("socket.io");
const MongoStore = require("connect-mongo")(session);
const nodemailer = require("nodemailer");
const async = require("async");
const crypto = require("crypto");

//--------------------
//    User Files
//--------------------
const CONFIG = require("./config");
const models = require("./models");
const Passport = require("./passport");
const db = require("./models");


//--------------------
//    INITIALIZATION
//--------------------
const app = express();
// Extract Server
const server = http.Server(app);
// Initialize Socket.io
const io = socketIO(server);


//--------------------
//    MIDDLEWARES
//--------------------

// Set View Engine
app.set("view engine", "ejs");

// Use Body Parser
app.use(bp.urlencoded({extended: true}));
app.use(bp.json());

// Use Cookie-Parser
app.use(cp(CONFIG.COOKIE_SECRET_KEY));
// Express-Session for Passport
app.use(session({
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({mongooseConnection: db.mongoose.connection})
}));

// Initialize Passport
app.use(Passport.initialize());
app.use(Passport.session());


// Serve static files
app.use("/", express.static(path.join(__dirname, "public_static")));

//--------------------
//  REQUEST HANDLERS
//--------------------

app.use(function (req, res, next) {
    res.locals.user = req.user;
    next();
});

// Routers
app.use("/polls", require("./routes/poll")(express.Router(), io));
app.use("/discussions", require("./routes/discussion"));
app.use("/users", require("./routes/user"));
app.use("/api", require("./routes/api"));

// root Route
app.get("/", (req, res) => res.render("index"));

// Login/Signup Page
app.get("/loginsignup", (req, res) => res.render("loginsignup"));

// Use passport Authenticate at Login POST Route
app.post("/login", Passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/loginsignup"
}));

// Get Route for Logging Out
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

// Signup POST Request
app.post("/signup", (req, res, next) => {
    if (!req.body.username || !req.body.password || !req.body.name || !req.body.email) {
        let err = new Error("Incomplete Details!");
        err.status = httpStatusCodes.BAD_REQUEST;
        return next(err);
    }

    // Find the User if already exists
    models.User.findOne({
        username: req.body.username
    })
        .then(user => {
            // If user does not exists, create new User
            if (user === null)
                return models.User.create({
                    username: req.body.username,
                    password: req.body.password,
                    name: req.body.name,
                    email: req.body.email
                });
            // Otherwise throw error if user exists
            else {
                let err = new Error("User already exists!");
                err.status = httpStatusCodes.CONFLICT;
                return next(err);
            }
        })
        .then(user => {
            // Redirect to Login/SignUp Page
            console.log("User created: ");
            console.log(user);

            // Log the current user in
            Passport.authenticate("local", {
                successRedirect: "/",
                failureRedirect: "/loginsignup"
            })(req, res, next);

        })
        .catch(next);
});

// Render Forgot-Password page
app.get('/forgot', function (req, res) {
    res.render('forgotpass');
});

// Forgot password route
app.post('/forgot', function (req, res, next) {
    async.waterfall([
        // Generates Random Token
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        // Update Database with the generated Token
        function (token, done) {
        // Find User
            models.User.findOne({
                email: req.body.email,
                username: req.body.username
            }, function (err, user) {
                if (!user) {
                    // TODO: req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }
                // Add Reset Token and Expiry time to Database
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        // Send Mail to user with the Reset Link
        function (token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: CONFIG.MAIL.USER,
                    pass: CONFIG.MAIL.PASS
                }
            });
            var mailOptions = {
                to: user.email,
                from: CONFIG.MAIL.USER,
                subject: 'Node.js Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                // TODO: req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

// Render Reset-Password page
app.get('/reset/:token', function (req, res) {
    models.User.findOne({
        resetPasswordToken: req.params.token,
        // Check for Valid Token
        resetPasswordExpires: {
            $gt: Date.now()
        }
    }, function (err, user) {
        if (!user) {
            // TODO: req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('resetpass');
    });
});

// Reset password route
app.post('/reset/:token', function (req, res) {
    async.waterfall([
        // Check For Token and Log User In
        function (done) {
            models.User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {$gt: Date.now()}
            }, function (err, user) {
                if (!user) {
                    // TODO: req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }

                // Update DB and invalidate Tokens
                user.password = req.body.password;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                // Save User
                user.save(function (err) {
                    req.logIn(user, function (err) {
                        done(err, user);
                    });
                });
            });
        },
        // Send Mail to User notifying about the change
        function (user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: CONFIG.MAIL.USER,
                    pass: CONFIG.MAIL.PASS
                }
            });
            var mailOptions = {
                to: user.email,
                from: CONFIG.MAIL.USER,
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                // TODO: req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], function (err) {
        res.redirect('/');
    });
});


// 404 ROUTES
// Generic Route for all other Routes: Renders 404 Error Page
app.use("/", (req, res) => {
    res.status(httpStatusCodes.NOT_FOUND).render("error-pages/400", {
        status: httpStatusCodes.NOT_FOUND,
        heading: httpStatusCodes.getStatusText(httpStatusCodes.NOT_FOUND),
        description: "Page not Found!"
    });
});


// ----------------------
// Error handling Routes
// ----------------------

app.use((err, req, res, next) => {
    console.error(err.stack);

    // If Response already sent, don't send it again and move forward
    if (res.headersSent)
        return;

    // Handling 4xx Errors: Render 400 page
    if (err.status && Math.floor(err.status / 100) === 4) {
        return res.status(err.status).render("error-pages/400", {
            status: err.status,
            heading: httpStatusCodes.getStatusText(err.status),
            description: err.message
        });
    }

    // Internal Server Error if no Error Code Stated
    err.status = err.status || httpStatusCodes.INTERNAL_SERVER_ERROR;

    // Handling other Errors(5xx): Render 500 Errors Page
    res.status(err.status).render("error-pages/500", {
        status: err.status,
        heading: httpStatusCodes.getStatusText(err.status),
        description: "Please try again after some time!"
    });
});


// Listen at specified Port
server.listen(CONFIG.SERVER.PORT, () => {
    console.log(`Server started at http://${CONFIG.SERVER.HOST}:${CONFIG.SERVER.PORT}/`);
});