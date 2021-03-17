import express from 'express';
import * as __socket_io from 'socket.io';
import * as __http from 'http';
import EventEmitter from 'events';
import * as path from 'path';
import {fileURLToPath} from 'url';

import WaitingQueue from './src/WaitingQueue.js';
import RoomManager from './src/RoomManager.js';

let app = new express();
let http = __http.Server(app);
let io = new __socket_io.Server(http);
let ee = new EventEmitter();

export {io, ee};

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
	},1000);
	socket.on('load_complete',()=>{clearInterval(cycle);});
	
	console.log('user connected: ', socket.id);

	socket.on('waiting',type=>{
		lobby.enter(socket,type);
    	lobby.getARoomYouTwo();
	});
	
	socket.on('disconnect', () => {
    	lobby.leave(socket);
		console.log('user disconnected: ', socket.id);
	});
});

//git test