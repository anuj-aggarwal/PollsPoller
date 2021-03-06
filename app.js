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
app.use(bp.urlencoded({ extended: true }));
app.use(bp.json());

// Use Cookie-Parser
app.use(cp(CONFIG.COOKIE_SECRET_KEY));
// Express-Session for Passport
app.use(session({
	secret: CONFIG.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	store: new MongoStore({ mongooseConnection: db.mongoose.connection })
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