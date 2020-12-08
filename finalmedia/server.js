// We need the file system here
var fs = require('fs');
				
// Express is a node module for building HTTP servers
var express = require('express');
var app = express();

// Tell Express to look in the "public" folder for any files first
app.use(express.static('public'));

// If the user just goes to the "route" / then run this function
app.get('/', function (req, res) {
  res.send('Hello World!')
});

///////
// Here is the actual HTTP server
//改成https
var https = require("https");


var options = {
	key: fs.readFileSync('star_itp_io.key'),
	cert: fs.readFileSync('star_itp_io.pem')
  };
// We pass in the Express object
var httpServer = https.createServer(options, app);
// Listen on port 80
httpServer.listen(443);
//////


// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io')(httpServer);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection', 

	// We are given a websocket object in our function
	function (socket) {
		console.log("We have a new client: " + socket.id);

	
		// Save Recording
		socket.on('myvideo', function(data){
			console.log(data);

      // Unique filename
			let filename = Date.now() + "_" + Math.random();
      // "data" below is blob sent from script
			fs.writeFile(__dirname + '/public/vids/' + filename + '.webm', data, function(err){
				if (err) console.log(err);
				console.log("It's saved!")
        //socket.broadcast.emit: sending to all clients except sender
        socket.broadcast.emit("myvideo", filename);
			});
		});	
		
		
		socket.on("disconnect", function() {
			console.log("Client has disconnected " + socket.id);
		  });
	}
);