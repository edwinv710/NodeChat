var http = require('http');
var socketio = require("socket.io");
var fs = require('fs');
var redis = require("redis"),
    client = redis.createClient();
var rooms = ["room_one", "room_two", "room_three", "room_four", "room_five"];

client.on("error", function (err) {console.log("Error " + err);});


var storeMessage = function(room, message) {
	client.lpush(room, message, function (err, res) {
		client.ltrim(room, 0, 9);
	});
	io.sockets.in(room).emit("displayMessage", message);
}

var emitMessages = function(room, socket){
	client.lrange(room, 0, -1, function(err, messages){
		messages = messages.reverse();
		messages.forEach(function(message) {
			socket.emit("displayMessage", message);
		});
	});
}

var handler = function(req, res) {
	fs.readFile(__dirname + '/index.html', function(err, data) {
		if(err) {
			res.writeHead(500);
			return res.end("Can not find index.html");
		} else {
			res.writeHead(200);
			res.end(data);
		}
	});
};

var app = http.createServer(handler);
var io = socketio.listen(app);

io.sockets.on("connection", function (socket) {
	var self = this;
	
	socket.join("room_one");
	
	emitMessages("room_one", socket);
	
	socket.on("chatMessage", function(data){
	  storeMessage(data[0], data[1]);
	});
	
	for (var i = 0; i < rooms.length; i++) {
		var room = rooms[i];
		var join_event = "join_"+room;
		socket.on(join_event, function(rooms){
			socket.leave(rooms[0]);
			socket.join(rooms[1]);
			socket.emit("clear_room");
			emitMessages(rooms[1], socket);
		});	
	}
	
});

app.listen(8080);

 // JavaScript Document