import {io} from '../index.js';

export default class LobbyManager {
	constructor(roomManager) {
		this.roomManager = roomManager;
		this.lobbies = [];
	}

	enter = (lobby,type) => {
		console.log(`${socket.id} has entered the queue`);
		this.queue.push(socket);
		this.type[socket.id] = type;
		io.to(socket.id).emit('create',type);
	};

	leave = (socket) => {
		let index = this.queue.indexOf(socket);
		if (index >= 0) {
			this.queue.splice(index, 1);
			delete this.type[socket.id];
		}
	};

	clean = () => {
		this.queue = this.queue.filter((socket) => {
			return socket != null;
		});
	};

	getARoomYouTwo = () => {
		if (this.roomMaking) return;
		this.roomMaking = true;

		while (this.queue.length > 1) {
			let socket1 = this.queue.splice(0,1)[0];
			let socket2 = this.queue.splice(0,1)[0];
			let type1 = this.type[socket1.id];
			let type2 = this.type[socket2.id];
			
			this.roomManager.create(socket1,socket2,type1,type2);
			delete this.type[socket1.id];
			delete this.type[socket2.id];
		}
		this.roomMaking = false;
	};
}