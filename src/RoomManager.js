import {io} from '../index.js';

export default class RoomManager {
	constructor() {
		this.rooms = [];
//		this.playingRooms = [];
		
		this.now = 0;
		this.last = 0;
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
			
			delete this.rooms[roomIndex];
			this.rooms.splice(roomIndex, 1);
		}
		
		return other;
	}

	getRoom = (socket) =>{
		let room = null;
		let roomIndex = this.findRoomIndex(socket);
		if(roomIndex!=-1){
			room = this.rooms[roomIndex];
		}
		return room;
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
		
		this.player0.join(this.id);
		this.player1.join(this.id);
		
		io.to(this.player0.id).emit('oppJoined',this.type1);
		io.to(this.player1.id).emit('oppJoined',this.type0)
		
		io.to(this.id).emit('seed',this.randomseed);
	}

	other = socket =>(this.player0.id == socket.id)?this.player1:this.player0;
	
	contains = socket => this.player0.id == socket.id || this.player1.id == socket.id;
	
	reset = () =>{
		if(this.count<2) return;
		console.log(`${this.id}: resetting room`);
		this.count = 0;
		this.randomseed = Math.random().toString(36).substr(2,11);
		io.to(this.id).emit('reset',this.randomseed);
	}

	start = () =>{
		if(this.count<2) return;
		this.count = 0;
		console.log(`${this.id}: starting game`);
		io.to(this.id).emit('countdown');
		this.status = STATUS.PLAYING;
	};

	playerReady = (id) => {
		this.count++;
		this.start();
		io.to(this.id).emit('readyStatus',id);
	}
	
	playerCancel = (id) => {
		this.count--;
		io.to(this.id).emit('cancelStatus',id);
	}
	
	playAgain = (id) => {
		io.to(this.id).emit('playAgainStatus', id);
		this.count++;
		this.reset();
	}
	
	gameOver = (id) => {
		io.to(this.id).emit('GAME_OVER',id);
		console.log(`${this.id}: ${id} lost`)
		this.status = STATUS.WAITING;
	}
	
	sendAttack = (socket, data) =>{
		let other = this.other(socket);
		if(other){
			console.log(`${socket.id} -> ${other.id} : ${data}`)
			io.to(other.id).emit('receiveAttack',data);			
		}
	}
	
	sendGraphicInfo = (socket, data) =>{
		let other = this.other(socket);
		if(other) io.to(other.id).emit('eview',data);
	}
	
	fireGarb = (socket) =>{
		let other = this.other(socket);
		if(other) io.to(other.id).emit('fireGarb');
	}
	
	trigAud = (socket,data) => {
		let other = this.other(socket);
		if(other) io.to(other.id).emit('enemyAud',data);
	}
}

const STATUS = {
	WAITING: 0,
	PLAYING: 1,
};