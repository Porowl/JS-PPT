export default class WaitingQueue {
	constructor(roomManager) {
		this.roomManager = roomManager;
		this.queue = [];
		this.roomMaking = false;
	}

	enter = (socket) => {
		console.log(`${socket.id} has entered the queue`);
		this.queue.push(socket);
	};

	leave = (socket) => {
		let index = this.queue.indexOf(socket);
		if (index >= 0) this.queue.splice(index, 1);
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
			console.log(socket1.id,socket2.id,this.queue.length)
			this.roomManager.create(socket1,socket2);
		}
		this.roomMaking = false;
	};
}