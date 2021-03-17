import TetPlayer from './Tetris/TetPlayer.js';
import TetView from './Tetris/TetView.js';
import PuyoPlayer from './PuyoPuyo/PuyoPlayer.js';
import PuyoView from './PuyoPuyo/PuyoView.js';
import Randomizer from './Randomizer.js'
import menu from './Menu.js';

import {canvas0, canvas1, canvas2, canvas3,GAME_STATE} from './constants.js';

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
		GUI = menu;
		GUI.changeScreenTo('title');
		socket.emit('load_complete')
	});
	
	socket.on('create',type=>{
		Player = type==='PUYO'?new PuyoPlayer(socket.id):new TetPlayer(socket.id);
		window.player = Player;
	});

	socket.on('oppJoined', type =>{
		EnemyView = type==='PUYO'?new PuyoView(1):new TetView(1);
		EnemyView.preview = true;
		Player.setOpponent(type);
		socket.emit('oppRecieved');
		window.player = Player;
	});
	
	socket.on('seed', seed=>{
		Player.random = new Randomizer(seed);
		GUI.changeScreenTo('ready');
	});

	socket.on('countdown', ()=>{
		GUI.changeScreenTo('empty');
		setTimeout(()=>{Player.View.countDown(3);EnemyView.countDown(3)},0);
		setTimeout(()=>{Player.View.countDown(2);EnemyView.countDown(2)},1000);
		setTimeout(()=>{Player.View.countDown(1);EnemyView.countDown(1)},2000);
		setTimeout(()=>{Player.View.countDown(0);EnemyView.countDown(0);Player.gameStart();},3000);
	})
	socket.on('update', dt =>{
		Player.update(dt);
	})
	
	socket.on('eview', data =>{
		let call = data.name;
		Array.isArray(data.args)?EnemyView[call](...data.args):EnemyView[call](data.args);
	})
	
	socket.on('GAME_OVER',STATE=>{
		let a = (STATE==GAME_STATE.WIN)?GAME_STATE.WIN:GAME_STATE.LOST;
		let b = 1-a;
		Player.View.display(a);
		EnemyView.display(b);
	});
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