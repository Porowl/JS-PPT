import TetPlayer from './Tetris/TetPlayer.js';
import TetView from './Tetris/TetView.js';
import PuyoPlayer from './PuyoPuyo/PuyoPlayer.js';
import PuyoView from './PuyoPuyo/PuyoView.js';
import Randomizer from './Randomizer.js'
import Menu from './Menu.js';

import {canvas0, canvas1, canvas2, canvas3} from './constants.js';

export let socket = io();
let requestId;
let keySettings = () => {};
let Player;
let EnemyView;
let screen;

const init = () => {
	resize();

	window.addEventListener('resize', resize, false);

	socket.on('connected', () => {
		screen = new Menu();
		
		// document.fonts.ready.then(() => {
		// 	Player = new PuyoPlayer(socket.id);
		// 	EnemyView = new PuyoView(1);
		// 	window.Player = Player;
		// 	setEvents();
		// 	socket.emit('waiting');
		// });
	});
	
	socket.on('seed', seed=>{
		Player.random = new Randomizer(seed);
		socket.emit('ready');
	});

	socket.on('update', dt =>{
		Player.update(dt);
	})
	
	document.addEventListener('keydown', (event) => {
		socket.emit('keydown', event.keyCode);
	});
	document.addEventListener('keyup', (event) => {
		socket.emit('keyup', event.keyCode);
	});
};

const gameStart = () => {
	document.getElementById('main').hidden = true;
};

const resize = () => {
	var ratio = canvas0.width / canvas0.height;
	var ch = window.innerHeight;
	var cw = ch * ratio;
	if (cw > window.innerWidth) {
		cw = Math.floor(window.innerWidth);
		ch = Math.floor(cw / ratio);
	}
	if (window.innerWidth > 1024) {
		cw = 1024;
		ch = 768;
	}
	canvas0.style.width = cw;
	canvas0.style.height = ch;
	canvas1.style.width = cw;
	canvas1.style.height = ch;
	canvas2.style.width = cw;
	canvas2.style.height = ch;
	canvas3.style.width = cw;
	canvas3.style.height = ch;
};

const setEvents = () => {
	socket.on('draw', (data) => {
		Player.draw(data);
	});
	socket.on('drawPiece', (data) => {
		Player.drawPiece(data.piece, data.MODE, data.index);
	});
	socket.on('clearPiece', () => {
		Player.clearPiece();
	});
	socket.on('drawNext', (data) => {
		Player.drawNext(data.typeId, data.index);
	});
	socket.on('refreshNexts', () => {
		Player.refreshNexts();
	});
	socket.on('drawHold', (data) => {
		Player.drawHold(data.typeId, data.mode);
	});
	socket.on('refreshHold', () => {
		Player.refreshHold();
	});
	socket.on('clearAnimation', (data) => {
		Player.clearAnimation(data.l, data.i);
	});
	socket.on('countDown', (data) => {
		Player.countDown(data);
	});
	socket.on('displayScore', (data) => {
		Player.displayScore(data);
	});
	socket.on('levelProgress', (data) => {
		Player.levelProgress(data.lines, data.level, data.goal);
	});
	socket.on('displayScoreArr', (data) => {
		Player.displayScoreArr(data);
	});
	socket.on('lockAnimation', (data) => {
		Player.lockAnimation(data.piece, data.frame, data.offset);
	});
	socket.on('hardDropAnimation', (data) => {
		Player.hardDropAnimation(data.tarPiece, data.offset);
	});
	socket.on('showGarbage', (data) => {
		Player.showGarbage(data);
	});
	socket.on('edraw', (data) => {
		EnemyView.draw(data);
	});
	socket.on('edrawPiece', (data) => {
		EnemyView.drawPiece(data.piece, data.MODE, data.index);
	});
	socket.on('eclearPiece', () => {
		EnemyView.clearPiece();
	});
	socket.on('edrawNext', (data) => {
		EnemyView.drawNext(data.typeId, data.index);
	});
	socket.on('erefreshNexts', () => {
		EnemyView.refreshNexts();
	});
	socket.on('edrawHold', (data) => {
		EnemyView.drawHold(data.typeId, data.mode);
	});
	socket.on('erefreshHold', () => {
		EnemyView.refreshHold();
	});
	socket.on('eclearAnimation', (data) => {
		EnemyView.clearAnimation(data.l, data.i);
	});
	socket.on('ecountDown', (data) => {
		EnemyView.countDown(data);
	});
	socket.on('edisplayScore', (data) => {
		EnemyView.displayScore(data);
	});
	socket.on('elevelProgress', (data) => {
		EnemyView.levelProgress(data.lines, data.level, data.goal);
	});
	socket.on('edisplayScoreArr', (data) => {
		EnemyView.displayScoreArr(data);
	});
	socket.on('elockAnimation', (data) => {
		EnemyView.lockAnimation(data.piece, data.frame, data.offset);
	});
	socket.on('ehardDropAnimation', (data) => {
		EnemyView.hardDropAnimation(data.tarPiece, data.offset);
	});
	socket.on('eshowGarbage', (data) => {
		EnemyView.showGarbage(data);
	});
};

window.init = init;