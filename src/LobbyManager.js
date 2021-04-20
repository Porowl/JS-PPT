import {io} from '../index.js';

export default class LobbyManager {
	constructor(roomManager) {
		this.roomManager = roomManager;
		this.rooms = [];
	}

	createRoom = (socket, type, roomid) => {
		if(!roomid) roomid = socket.id;
		console.log(`${socket.id} has made room: ${roomid}`);
		this.rooms[roomid] = new customRoom(socket, roomid);
		io.to(socket.id).emit('create',type);
	};

	getRoomArr = () => {
		
	}

	askPassword = () => {
		
	}
	
	enterRoom = (socket, roomid) => {
	}
	
	leave = () => {
		
	};
}

class customRoom{
	constructor(){
		
	}
}