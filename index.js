import express from 'express';
import * as __socket_io from 'socket.io';
import * as __http from 'http';
import EventEmitter from 'events';
import * as path from 'path';
import {fileURLToPath} from 'url';

import WaitingQueue from './src/WaitingQueue.js';
import RoomManager from './src/RoomManager.js';
import rug from 'random-username-generator';

let app = new express();
let http = __http.Server(app);
let io = new __socket_io.Server(http);
let ee = new EventEmitter();

export {io, ee};

let numUser = 0;
let Rmgr = new RoomManager();
let lobby = new WaitingQueue(Rmgr);
let __dirname = path.dirname(fileURLToPath(import.meta.url));
	
app.use(express.static(path.join(__dirname, 'public')));

let port = process.env.PORT || 3000;
http.listen(port, () => {
	console.log('server on!: https://jsppt.run.goorm.io/');
});

let objects = {};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'public','./client.html'));
});

io.on('connection', (socket) => {
	let cycle = setInterval(()=>{
		io.to(socket.id).emit('connected')
	},500);
	socket.on('load_complete',()=>{
		clearInterval(cycle);
	});
	
	console.log('user connected: ', socket.id);

	socket.on('askCurrPlayers',()=>{
		socket.emit('currPlayers',io.engine.clientsCount);	
	});
	
	socket.on('waiting',type=>{
		lobby.enter(socket,type);
    	lobby.getARoomYouTwo();
	});
	
	socket.on('disconnect', () => {
		onDisconnection(socket);
		console.log('user disconnected: ', socket.id);
	});
	
	socket.on('leaveRoom', () =>{
		onDisconnection(socket)
		io.to(socket.id).emit('connected')
	})
	
	// GAMES
	
	socket.on('ready', ()=>{
		let room = Rmgr.getRoom(socket);
		if(room) room.playerReady(socket.id);
	});
	socket.on('cancel', ()=>{
		let room = Rmgr.getRoom(socket);
		if(room) room.playerCancel(socket.id);
	});
	socket.on('graphics', data=>{
		let room = Rmgr.getRoom(socket);
		if(room) room.sendGraphicInfo(socket, data);
	})
	socket.on('playAgain',()=>{
		let room = Rmgr.getRoom(socket);
		if(room) room.playAgain(socket.id);
	});
	socket.on('sendAttack',data =>{
		let room = Rmgr.getRoom(socket); let other = null;
		if(room) room.sendAttack(socket, data);
	});
	socket.on('gameOver', () =>{
		let room = Rmgr.getRoom(socket); let other = null;
		if(room) room.gameOver(socket.id);
	});
});


const onDisconnection = socket => {
	lobby.leave(socket);
	let other = Rmgr.leave(socket);
	if(other) io.to(other.id).emit('oppDisconnected');
}

//git test