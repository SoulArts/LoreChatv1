// Setup basic express server
var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 5000;

//sauvgarde de fichier
var fs = require('fs');
saveFile("public/log","");

server.listen(port, function () {
  log('Server listening at port '+port);
});

// Routing
app.use(express.static(__dirname + '/public'));


var Users = {
	'count':0,
	'usernames':{}
};

//var BannedNames = readJson('json/ban');
var DEFAULSERVERNAME = 'SERVER';

var PASSWORDS = {
	'soulmod': 'pass121',
	'souladm': 'pass1213',
	'ililith': 'pass1212'
}

var SLOW = 0;

var ROOMSPASS = [];
ROOMSPASS['SoulArts'] = '';

io.on('connection', function (socket) {
  socket.room = 'SoulArts';
  socket.join(socket.room);

	//Quand le client emet un 'send message'
	socket.on('send msg', function(data){
		//On emet au client d'exectuter 'new message'
		data.user.username = Users.usernames[data.user.uid].username;
		log('['+socket.room+'] <'+data.user.username+'> '+data.message.text);
		socket.broadcast.to(socket.room).emit('new msg', data);
	});

	socket.on('add user', function (username) {
		username = username.replace(" ","_");
		username = username.replace(/[^a-zA-Z0-9-_-]/g,'');

		//if(!username || BannedNames.indexOf(username) != -1 || getAllUsernameConnected().indexOf(username) != -1 ){
		//	username = "visiteur-"+Math.floor((Math.random() * 10000) + 1);
		//}

    	// add the client's username to the global list
    	var uid = genereUid(username);
    	Users.usernames[uid] = {
    		'username': username,
    		'ranks': {
    			'moderation':0
    		},
    		'uid': uid,
    		'socketId':socket.id,
        'room': socket.room
    	}

    	Users.count = Users.count+1;

    	// we store the username in the socket session for this client
    	socket.username = username;
    	socket.uid = uid;

    	log('['+socket.room+'] '+DEFAULSERVERNAME+' '+username+' join');

    	socket.emit('login', {
	  		user: Users.usernames[uid],
	  		allUsers: Users,
	  		serverName: DEFAULSERVERNAME,
        slow: SLOW
    	});

    	socket.broadcast.to(socket.room).emit('user joined', {
      		username: socket.username,
	  		allUsers: Users
    	});
      socket.broadcast.emit('update userlist', Users);
	});

	socket.on('disconnect', function () {
		if(socket.username){
		 	log('['+socket.room+'] '+DEFAULSERVERNAME+' '+socket.username+' left');
	    	// remove the username from global usernames list
		   	delete Users.usernames[socket.uid];
	      	Users.count--;

	      // echo globally that this client has left
	      socket.broadcast.to(socket.room).emit('user left', {
	        username: socket.username,
	        allUsers: Users
	      });
        socket.broadcast.emit('update userlist', Users);
	  	}
	});

	socket.on('user info', function(uid){
		socket.emit('user info', Users.usernames[uid]);
	});
	///////////////
	// Commandes //
	///////////////

	socket.on('command',function(data){
		if(data.uid){
			var user = Users.usernames[data.uid];
			var command = data.command;

			executeCommand(command,user,socket);
		}
	});
});

function genereUid(username){
	var uid=1234567891234567;
	for(var i=0; i < username.length; i=i+3){
		if(username[i] && username[i+1])
			uid = uid - (username.charCodeAt(i)*username.charCodeAt(i+1));
		else if(username[i]){
			uid = uid - username.charCodeAt(i)
		}

		uid = uid.toString();
		uid = uid.split("").reverse().join("");
		uid = Number(uid);

		if(username[i+2])
			uid = uid * username.charCodeAt(i+2);
	}

	uid = Math.abs(uid) % 10000000000000000;
	return "uid-"+uid;
}

function getAllUsernameConnected(){
	var usernames = [];
	for (var uid in Users.usernames){
		usernames.push(Users.usernames[uid].username);
	}

	return usernames;
}

function promoteUser(uid, type, rank){
	Users.usernames[uid].ranks[type] = rank;
}

function generateMsgCid(){
	var date = new Date();
	var cid = date.getDate()+''+date.getMonth()+''+date.getYear()+''+date.getUTCHours()+''+date.getMinutes()+''+date.getSeconds()+''+date.getMilliseconds();
	cid = cid+''+Math.floor(Math.random()*10000);
	return 'cid-'+cid;
}

function getServerUser(){
	return {
		'username': DEFAULSERVERNAME,
		'ranks': {
			'moderation': 1000
		}
	};
}

function getAllRooms(){
	var rooms = ["Default"];
	for (var uid in Users.usernames){
		var room = Users.usernames[uid].room;
		if(rooms.indexOf(room) == -1)
			rooms.push(room);
	}

	return rooms;
}

function saveFile(path,text){
	fs.writeFile(path, text, function(err) {
    	if(err) {
        	return log(err);
    	}

   		//log(path+" was saved!");
	});
}

function addFile(path,text){
	fs.appendFile(path, text, function(err) {
    	if(err) {
        	return log(err);
    	}

   		//log(path+" was saved!");
	});
}

function saveObject(path,obj){
	saveFile(path,JSON.stringify(obj));
}

function readJson(path){
	return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function log(text){
	console.log(text);
	addFile("log", "["+getDate()+"] "+text+"\n");
}

function getDate(){
	var date = new Date();
	return date.getDate()+"/"+(date.getMonth()+1)+" "+(date.getHours()+1)+":"+(date.getMinutes()+1)+":"+(date.getSeconds()+1);
}
function executeCommand(command,user,socket){
	log('['+socket.room+'] <'+user.username+'> execute '+command.cmd);
  	//log(JSON.stringify(command.param));

	var server = getServerUser();
	var cid = generateMsgCid();
	var execCommand = 0;

	switch(command.cmd){
		case 'login':
			if(command.param == PASSWORDS.soulmod){
				promoteUser(user.uid,'moderation',1);
				socket.emit('cmd', {
					'valRetour': 1,
					'callback': 'login',
					'message': 'Logged on Moderator.'
				});
				socket.broadcast.emit('update userlist', Users);
				socket.emit('update userlist', Users);

				execCommand = 1;
				log('----> OK');
			} 
			else if(command.param == PASSWORDS.souladm){
				promoteUser(user.uid,'moderation',2);
				socket.emit('cmd', {
					'valRetour': 2,
					'callback': 'login',
					'message': 'Logged on Admin.'
				});
				socket.broadcast.emit('update userlist', Users);
				socket.emit('update userlist', Users);

				execCommand = 1;
				log('----> OK');

			}
			else if(command.param == PASSWORDS.ililith){
				promoteUser(user.uid,'moderation',2);
				socket.emit('cmd', {
					'valRetour': 2,
					'callback': 'login',
					'message': 'Logged on Lilith.'
				});
				socket.broadcast.emit('update userlist', Users);
				socket.emit('update userlist', Users);

				execCommand = 1;
				log('----> OK');
			}

			else {
				socket.emit('cmd', {
					'valRetour': 0,
					'callback': 'login',
					'message': 'Wrong Password.'
				});
				execCommand = 1;
				log('----> FAIL');
			}
			break;

		case 'logout':
			promoteUser(user.uid,'moderation',0);
			socket.emit('cmd', {
					'valRetour': 1,
					'callback': 'logout',
					'message': 'Logged out.'
				});
			execCommand = 1;
			log('----> OK');
			break;

		case 'kick':
			if(user.ranks.moderation >= 1){
				execCommand = 1;
				var kickUser = Users.usernames[command.param];
				log('kick '+kickUser.username);

				socket.broadcast.to(socket.room).emit('cmd', {
						'valRetour': kickUser.username,
						'callback': 'kick',
						'message': kickUser.username+" was kicked by "+user.username+'.'
				});

				socket.emit('cmd', {
						'valRetour': kickUser.username,
						'callback': 'kick',
						'message': kickUser.username+" was kicked/"
				});

				log('----> OK');
			}
			break;

		case 'ban':
			if(user.ranks.moderation >= 2){
				execCommand = 1;
				log('ban '+command.param);
				//BannedNames.push(command.param);
				//saveObject('json/ban',BannedNames);

				socket.emit('cmd', {
						'valRetour': command.param,
						'callback': 'ban',
						'message': command.param+" was banned."
				});

				socket.broadcast.to(socket.room).emit('cmd', {
						'valRetour': command.param,
						'callback': 'kick',
						'message': command.param+" was banned by "+user.username+'.'
				});

        //delete Users.username[command.param];
        Users.count --;
        socket.broadcast.emit('update userlist', Users);
        socket.emit('update userlist', Users);

				log('----> OK');
			}
			break;

		case 'removeMsg':
			if(user.ranks.moderation >= 1){
				execCommand = 1;
				socket.emit('cmd', {
						'valRetour': command.param,
						'callback': 'removeMsg'
				});
				socket.broadcast.to(socket.room).emit('cmd', {
						'valRetour': command.param,
						'callback': 'removeMsg'
				});
				log('----> OK');
			}
			break;

		case 'clean':
			if(user.ranks.moderation >= 2){
				socket.emit('cmd', {
						'valRetour': 1,
						'callback': 'clean',
						'message': 'Chat cleaned.'
				});
				socket.broadcast.to(socket.room).emit('cmd', {
						'valRetour': '',
						'callback': 'clean',
						'message': "Chat cleaned by "+user.username+'.'
				});
				execCommand = 1;
				log('----> OK');
			}
			break;

		case 'popup':
			if(user.ranks.moderation >= 2){
				socket.emit('cmd', {
						'valRetour': 1,
						'callback': 'popup',
						'message': 'Popup printed: '+command.param
				});
				socket.broadcast.to(socket.room).emit('cmd', {
						'valRetour': command.param,
						'callback': 'popup',
						'message': ''
				});
				execCommand = 1;
				log('----> OK');
			}
			break;

		case 'msg':
			if(Users.usernames[command.param.toUid]){
				var toSocket = Users.usernames[command.param.toUid].socketId;
				io.to(toSocket).emit('msg',command.param);
				execCommand = 1;
				log('----> OK');
			}
			break;

	    case 'join':
	     	var rooms = getAllRooms();
	     	if(command.param.pass){
	     	  log('----> Private Room');
	     	  command.param.room = '('+command.param.room+')';
	     	}
	     	if(rooms.indexOf(command.param.room) != -1 && command.param.room == '('+command.param.room.replace(/[()]/g,'')+')' && user.ranks.moderation < 1 && command.param.pass != ROOMSPASS[command.param.room]){
	     	  execCommand = 1;
	     	  log('----> FAIL');
	     	  socket.emit('cmd', {
	     	      'valRetour': 0,
	     	      'callback': 'join',
	     	      'message': command.param.room+' is a private room.'
	     	  });
	     	} else if(rooms.indexOf(command.param.room == -1)){
	     	  socket.leave(socket.room);
	     	  socket.broadcast.to(socket.room).emit('cmd', {
	     	      'valRetour': '',
	     	      'callback': 'join',
	     	      'message': socket.username+' leave the room'
	     	  });
	     	  socket.emit('cmd', {
	     	      'valRetour': {'type': 'leave', 'room': socket.room},
	     	      'callback': 'join',
	     	      'message': 'Leave the room: '+socket.room
	     	  });
	     	  socket.join(command.param.room);
	     	  socket.room = command.param.room;
	     	  Users.usernames[user.uid].room = socket.room;
	     	  ROOMSPASS[command.param.room] = command.param.pass;
	     	  socket.broadcast.to(socket.room).emit('cmd', {
	     	      'valRetour': '',
	     	      'callback': 'join',
	     	      'message': socket.username+' join the room'
	     	  });
	     	  socket.emit('cmd', {
	     	      'valRetour': {'type': 'join', 'room': socket.room},
	     	      'callback': 'join',
	     	      'message': 'Join the room: '+socket.room
	     	  });
	     	  socket.broadcast.emit('update userlist', Users);
	     	  socket.emit('update userlist', Users);
	     	  execCommand = 1;
	     	  log('----> OK');
	      	}
	  		break;

	    case 'slow':
	  		if(user.ranks.moderation >= 1){
	        SLOW = command.param;
	        socket.broadcast.to(socket.room).emit('cmd', {
	            'valRetour': SLOW,
	            'callback': 'slow',
	            'message': 'messages delay time: '+SLOW+'s'
	        });
	        socket.emit('cmd', {
	            'valRetour': SLOW,
	            'callback': 'slow',
	            'message': 'Messages delay time: '+SLOW+'s'
	        });
	  			execCommand = 1;
	  			log('----> OK');
	  		}
	  		break;

	    case 'invite':
	      	if(Users.usernames[command.param]){
	      	  var toSocket = Users.usernames[command.param].socketId;
	      	  io.to(toSocket).emit('cmd', {
	      	      'valRetour': {by: user.username, room: user.room.replace(/[()]/g,''), pass: ROOMSPASS[user.room]},
	      	      'callback': 'invite',
	      	      'message': ''
	      	  });
	      	  execCommand = 1;
	      	  log('----> OK');
	      	}
	      	break;

		default:
			socket.emit('cmd', {
					'valRetour': "Command not found.",
					'callback': ''
				});
			break;
	}

	if(!execCommand){
		socket.emit('cmd', {
					'valRetour': "Not permitted.",
					'callback': ''
				});
			log('----> FAIL');
		}
}
