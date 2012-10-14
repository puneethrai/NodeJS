///////////////////////////////////
// Server Node.js with socket.IO //
///////////////////////////////////

/**
 * Declare the server HTTP
 * listen to the port 8888
 */
var http = require("http");
var server = http.createServer();
var app = server.listen(8888);

/**
 * Import socket.io module
 * on the server HTTP
 */
var io = require('socket.io').listen(app);

/**
 * Declare the variable messages for the chat
 */
var messages = new Array();
/*
 *Declare the variable for seesion type
 */
var sessiontype = new Array();
var password = new Array();
/**
* When a user connects
*/
io.sockets.on('connection', function (client) {

	//-- Variables declarations--//
	var guest = false;
	var room = '';
	var session;
	/**
	 * When a user is invited
	 * join the room
	 * @param {int} invitation : room number
	 */
	client.on("invite", function(invitation){
		room = invitation;
		guest = true;
		client.join(room);
		messages[room] = new Array();
		session = sessiontype[room];
		client.emit('onsessiontype', {type : session});
	});
	/**
	 * When a user is invited & request password
	 * @param {int} invitation : room number
	 * @return {void} password : password
	 */
	client.on("retpassword", function(invitation){
		client.emit('onretpassword',{password : password[invitation]});
	});
	/**
	 * If you are the first user to connect 
	 * create room
	 */
	if(!guest){
		room = Math.floor(Math.random()*1000001).toString();
		client.emit('getRoom', {roomId : room});
		client.join(room);
		messages[room] = new Array();
	}
	client.on("sessiontype",function(data)	{
			sessiontype[data.roomid]=data.type;
			password[data.roomid]=data.password;
			//client.emit('onsessiontype', {dato:data.roomid});
			//client.emit('onsessiontype', {type:data.type});
	});
	/**
	 * When a user send a SDP message
	 * broadcast to all users in the room
	 */
  	client.on('message', function(message) {
        var broadcastMessage = message;
        client.broadcast.to(room).send(broadcastMessage);
    });

    /**
	 * When a user changes for a next slide
	 * broadcast to all users in the room
	 */
    client.on('prevSlide', function() {
    	client.broadcast.to(room).emit('prevSlide');
    });

    /**
	 * When a user changes for a previous slide
	 * broadcast to all users in the room
	 */
    client.on('nextSlide', function() {
    	client.broadcast.to(room).emit('nextSlide');
    });

    /**
	 * List of messages (chat)
	 */
	client.emit('recupererMessages', messages[room]);

	/**
	 * When we receive a new message (chat)
	 * add to the array
	 * broadcast to all users in the room
	 */
	client.on('nouveauMessage', function (mess) {
		messages[room].push(mess);
		client.broadcast.to(room).emit('recupererNouveauMessage', mess);
	});

	/**
	 * When the user hang up
	 * broadcast bye signal to all users in the room
	 */
 	client.on('exit',function(){
    	client.broadcast.to(room).emit('bye');
  	});

  	/**
	 * When the user close the application
	 * broadcast close signal to all users in the room
	 */
  	client.on('disconnect',function(){
    	client.broadcast.to(room).emit('close');
  	});
});