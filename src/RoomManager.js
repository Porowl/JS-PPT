import {io} from '../index.js';

export default class RoomManager {
	constructor() {
		this.rooms = [];
		this.playingRooms = [];
		
		this.now = 0;
		this.last = 0;
		
		setInterval(()=>this.update(),1000/60);
	}

	create = (player0, player1) => {
		let roomNum = player0.id + player1.id;
		let room = new Room(roomNum, player0, player1);

		this.rooms.push(room);
		console.log(`Created room for ${player0.id} & ${player1.id}`);
	};

	findRoomIndex = (socket) => {
		let roomIndex = null;
		this.rooms.some((room, index) => {
			for (let object in room.objects) {
				let obj = room.objects[object];
				if (obj.id == socket.id) {
					roomIndex = index;
					return true;
				}
			}
		});
		return roomIndex;
	};

	update = ( ) => {
		this.now = Date.now();
		let dt = (this.now - this.last)/1000;
		this.last = this.now;
		
		for(var roomId in this.rooms){
			var room = this.rooms[roomId];
			room.update(dt)
		}
	}
}

class Room {
	constructor(id, p0, p1) {
		this.id = id;
		this.player0 = p0.id;
		this.player1 = p1.id;
		this.status = STATUS.WAITING;
		this.obj = {};
		this.randomseed = Math.random().toString(36).substr(2,11);
		
		this.count = 0;
		
		p0.join(this.id);
		p1.join(this.id);
		
		
		p0.on('ready',()=>{
			this.count++;
			console.log(`${this.id} called ready, current readies are ${this.count}`)
			if(this.count>=2) this.start();
		});
		p1.on('ready',()=>{
			this.count++;
			console.log(`${this.id} called ready, current readies are ${this.count}`)
			if(this.count>=2) this.start();
		});
		
		io.to(this.id).emit('seed',this.randomseed);
		// io.to(this.player0).emit('seed',this.randomseed)
		// io.to(this.player1).emit('seed',this.randomseed)
		
		p0.on('attackFromP'+this.player0, data => {
			io.to(this.player1).emit('attackToP'+this.player1, data);
		});
		p1.on('attackFromP'+this.player1, data => {
			io.to(this.player0).emit('attackToP'+this.player0, data);
		});
	}

	start = () =>{
		console.log(`starting game`);
		
		io.to(this.id).emit('countdown');
		
		setTimeout(()=>{
			this.status = STATUS.PLAYING;
		},3000);
	};
	
	update = (dt) => {
		if (this.status == STATUS.PLAYING) {
			io.to(this.id).emit('update',dt);
		}
	};
}

const STATUS = {
	WAITING: 0,
	PLAYING: 1,
};