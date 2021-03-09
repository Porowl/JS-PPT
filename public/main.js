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
let GUI;

const init = () => {
	resize();

	window.addEventListener('resize', resize, false);

	socket.on('connected', () => {
		GUI = Menu;
		GUI.init();
	});
	
	socket.on('create',type=>{
		console.log('server said hi and said',type)
		Player = type==='PUYO'?new PuyoPlayer(socket.id):new TetPlayer(socket.id);
	});

	socket.on('oppJoined', type =>{
		console.log('server said your opp is ready and said',type)
		EnemyView = type==='PUYO'?new PuyoView(1):new TetView(1);
		socket.emit('oppRecieved');
	});
	
	socket.on('seed', seed=>{
		Player.random = new Randomizer(seed);
		socket.emit('ready');
	});

	socket.on('update', dt =>{
		Player.update(dt);
	})
	
	socket.on('eview', data =>{
		let call = data.name;
		EnemyView[call](data.args);
	})
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

window.init = init;