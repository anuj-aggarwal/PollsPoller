# PollsPoller

A Web Application to allow Users to Create, Edit Polls with Live Voting using Web Sockets.
Allows for Discussion on Polls in a separate Discussion Forum for each Poll with Unlimited Reply on Posts.

## Installation

```
git clone https://github.com/anuj-aggarwal/PollsPoller.git
cd PollsPoller
npm install
```

## Setup

Create a MongoDB user <DB_USER> with <DB_PASSWORD>

Create a secret.json file in this format:
```json
{
    "DB": {
		"HOST": "localhost",
		"PORT": 27017,
		"NAME": "<DB_NAME>"
	},
	"SERVER": {
		"PORT": "<PORT_NUMBER>",
		"HOST": "localhost"
	},
	"COOKIE_SECRET_KEY": "<COOKIE_SECRET>",
	"SESSION_SECRET": "<SESSION_SECRET></SESSION_SECRET>"
}
```

## Running

```
npm start
```

### Running MongoDB database
Make sure that MongoD is running. To start MongoDB Daemon, run these commands on a separate terminal:
```
mkdir data
mongod --dbpath=./data
```

## Built With

* [Express](https://expressjs.com/) - The Node.js Framework for HTTPS Server
* [Mongoose](http://mongoosejs.com/) - Node.js ORM for MongoDB Database
* [Passport](http://www.passportjs.org/) - Used for Authentication
* [Socket.io](https://socket.io/) - User for Handling Web Sockets for Live Voting

## Authors

* [**Anuj Aggarwal**](https://github.com/anuj-aggarwal/)
* [**Abhishek Ranjan**](https://github.com/abhishekr700/)
* [**Dev Pabreja**](https://github.com/devpabreja/)
