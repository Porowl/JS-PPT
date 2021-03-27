import {io} from '../index.js';

export default class RoomManager {
	constructor() {
		this.rooms = [];
//		this.playingRooms = [];
		
		this.now = 0;
		this.last = 0;
		
		setInterval(()=>this.update(),1000/60);
	}

	create = (player0, player1, type0, type1) => {
		let room = new Room(player0, player1, type0, type1);

		this.rooms.push(room);
		console.log(`Created room for ${player0.id} & ${player1.id}`);
	};

	leave = socket => {
		let roomIndex = this.findRoomIndex(socket);
		let other;

		if (roomIndex >= 0) {
			let room = this.rooms[roomIndex];
			
			other = room.other(socket);
			socket.leave(room.id);
			other.leave(room.id);
			room.turnOff();
			
			delete this.rooms[roomIndex];
			this.rooms.splice(roomIndex, 1);
		}
		
		return other;
	}

	findRoomIndex = (socket) => {
		let roomIndex = -1;
		this.rooms.some((room, index) => {
			if(room.contains(socket)){
				roomIndex = index;
				return true;
			}
		});
		return roomIndex;
	};

	update = () => {
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
	constructor(p0, p1, type0, type1) {
		this.id = p0.id+p1.id;
		this.player0 = p0;
		this.player1 = p1;
		this.type0 = type0;
		this.type1 = type1;
		this.status = STATUS.WAITING;
		this.randomseed = Math.random().toString(36).substr(2,11);
		
		this.count = 0;
		
		p0.join(this.id);
		p1.join(this.id);
		
		io.to(this.player0.id).emit('oppJoined',this.type1);
		io.to(this.player1.id).emit('oppJoined',this.type0)
		
		io.to(this.id).emit('seed',this.randomseed);
		
		p0.on('ready',()=>{
			this.count++;
			this.start();
			io.to(this.id).emit('readyStatus',this.player0.id);
		});
		p1.on('ready',()=>{
			this.count++;
			this.start();
			io.to(this.id).emit('readyStatus',this.player1.id);
		});
		p0.on('cancel',()=>{
			this.count--;
			io.to(this.id).emit('cancelStatus',this.player0.id);
		});
		p1.on('cancel',()=>{
			this.count--;
			io.to(this.id).emit('cancelStatus',this.player1.id);
		});
		// io.to(this.player0).emit('seed',this.randomseed)
		// io.to(this.player1).emit('seed',this.randomseed)
		
		p0.on('attackFromP'+this.player0.id, data => {
			console.log(`attack recieved from ${this.player0.id} and sending ${data} to ${this.player1.id}`)
			io.to(this.player1.id).emit('attackOnP'+this.player1.id, data);
		});
		p1.on('attackFromP'+this.player1.id, data => {
			console.log(`attack recieved from ${this.player1.id} and sending ${data} to ${this.player0.id}`)
			io.to(this.player0.id).emit('attackOnP'+this.player0.id, data);
		});
		
		p0.on('graphics',data=>{
			io.to(this.player1.id).emit('eview',data)
		})
		p1.on('graphics',data=>{
			io.to(this.player0.id).emit('eview',data)
		})
		
		p0.on('gameOver',()=>{
			io.to(this.player1.id).emit('GAME_OVER',0);
			io.to(this.player0.id).emit('GAME_OVER',1);
			this.status = STATUS.WAITING;
		});
		p1.on('gameOver',()=>{
			io.to(this.player0.id).emit('GAME_OVER',0);
			io.to(this.player1.id).emit('GAME_OVER',1);
			this.status = STATUS.WAITING;
		});
		
		p0.on('playAgain',()=>{
			io.to(this.id).emit('playAgainStatus', this.player0.id);
			this.count++;
			this.reset();
		});
		p1.on('playAgain',()=>{
			io.to(this.id).emit('playAgainStatus', this.player1.id);
			this.count++;
			this.reset();
		});
	}

	other = socket =>(this.player0.id == socket.id)?this.player1:this.player0;
	
	contains = socket => this.player0.id == socket.id || this.player1.id == socket.id;
	
	reset = () =>{
		if(this.count!=2) return;
		this.randomseed = Math.random().toString(36).substr(2,11);
		io.to(this.id).emit('reset',this.randomseed);
		this.count = 0;
	}

	start = () =>{
		console.log(this.id, this.count);
		if(this.count<2) return;
		
		this.count = 0;
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

	turnOff = () =>{
		p0.off('ready');
		p0.off('cancel');
		p0.off('attackFromP'+this.player0.id);
		p0.off('graphics');
		p0.off('gameOver');
		p0.off('playAgain');
		p1.off('ready');
		p1.off('cancel');
		p1.off('attackFromP'+this.player1.id);
		p1.off('graphics');
		p1.off('gameOver');
		p1.off('playAgain');
	}
}

const STATUS = {
	WAITING: 0,
	PLAYING: 1,
};