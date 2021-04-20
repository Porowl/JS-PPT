import {io} from '../index.js';

export default class LobbyManager {
	constructor(roomManager) {
		this.roomManager = roomManager;
		this.rooms = [];
		this.sockets = [];
	}

	createRoom = (socket, type, roomid, password) => {
		if(!roomid) roomid = socket.id; 
		console.log(`${socket.id} has made room: ${roomid}`);
		this.rooms[roomid] = new customRoom(socket, roomid, password);
		this.sockets[socket.id] = roomid;
		io.to(socket.id).emit('create',type);
	}

	getRoomArr = () =>  Object.keys(this.rooms);

	enterRoom = (socket, roomid) => {
		let room = this.rooms[roomid];
		if(room){
			if(room.requirePassword()){
				socket.emit('askPassword',roomid)
			} else {
				//let user enter
			}
		} else {
			//alert user the room seems doesn't exist anymore!
		}
	}
	
	destroyRoom = () => {
		
	};
}

class customRoom{
	constructor(socket, roomid, password){
		this.socket = socket;
		this.roomid = roomid;
		this.password = password;
		this.passwordRequired = (password)?true:false;
	}
	
	matchPassword = (password) => password === this.password;
	requiresPassword = () => this.passwordRequired;
	getRoomOwner = () => {};
}