export let socket = io();
import TetPlayer from './Tetris/TetPlayer.js';
import TetView from './Tetris/TetView.js';
import PuyoPlayer from './PuyoPuyo/PuyoPlayer.js';
import PuyoView from './PuyoPuyo/PuyoView.js';
import Randomizer from './Randomizer.js'
import menu from './Menu.js';

import {canvas0, canvas1, canvas2, canvas3,GAME_STATE,playSound,SOUNDS} from './constants.js';

let established = false;
let requestId;
let keySettings = () => {};
let Player;
let EnemyView;
let GUI;
let myType;
let enemyType;

const init = () => {
	resize();

	window.addEventListener('resize', resize, false);
	window.addEventListener('focus',()=>{
		document.title = 'JS-PPT';
		PageTitleNotification.off();
	});
	
	socket.on('connected', () => {
		if(established) return;
		established = true;
		GUI = menu;
		GUI.changeScreenTo('title');
		socket.emit('load_complete')
	});
	
	socket.on('create',type=>{
		resetPlayer(Player);
		
		myType = type;
		Player = myType==='PUYO'?new PuyoPlayer(socket.id):new TetPlayer(socket.id);
	});

	socket.on('oppJoined', type =>{
		enemyType = type;
		EnemyView = enemyType === 'PUYO'?new PuyoView(1):new TetView(1);
		
		if(!document.hasFocus()) PageTitleNotification.on("Opponent has joined!", 1000);
		playSound(SOUNDS.PLAYER_JOIN)
		
		EnemyView.preview = true;
		Player.setOpponent(enemyType);
		Player.View.display();
		EnemyView.display();
		
		socket.emit('oppRecieved');
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
	
	socket.on('readyStatus', data=>{
		if(data==socket.id){
			Player.View.display(GAME_STATE.READY);
		} else {
			EnemyView.display(GAME_STATE.READY);
		}
	});
	
	socket.on('cancelStatus', data=>{
		if(data==socket.id){
			Player.View.display();
		} else {
			EnemyView.display();
		}
	});
	
	socket.on('playAgainStatus', data=>{
		if(data==socket.id){
			Player.View.display(GAME_STATE.PLAY_AGAIN);
		} else {
			EnemyView.display(GAME_STATE.PLAY_AGAIN);
		}
	});
	
	socket.on('oppDisconnected',()=>{
		console.log('enemy disconnected');
		EnemyView.display(GAME_STATE.DISCONNECTED);
		GUI.changeScreenTo('returnToMain');
	});
	
	socket.on('GAME_OVER',STATE=>{
		let a = (STATE==GAME_STATE.WIN)?GAME_STATE.WIN:GAME_STATE.LOST;
		let b = 1-a;
		Player.View.display(a);
		EnemyView.display(b);
		GUI.changeScreenTo('replay');
	});
	
	socket.on('reset',seed=>{
		resetPlayer(Player);
		
		Player = myType==='PUYO'?new PuyoPlayer(socket.id):new TetPlayer(socket.id);
		EnemyView = enemyType === 'PUYO'?new PuyoView(1):new TetView(1);
		Player.random = new Randomizer(seed);
		EnemyView.preview = true;
		Player.setOpponent(enemyType);
		Player.View.display();
		EnemyView.display();
		GUI.changeScreenTo('ready');
	})
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

const resetPlayer = (user) =>{
	if(user){
		let eventNames = user.eventTriggerNames;
		let events = user.events;
		
		for(let i = 0; i<eventNames.length;i++){
			document.removeEventListener(eventNames[i],events[i]);
		}
		user = null;
	}
}

const PageTitleNotification = {
    vars:{
        OriginalTitle: document.title,
        Interval: null
    },    
    on: function(notification, intervalSpeed){
        var _this = this;
        _this.vars.Interval = setInterval(function(){
             document.title = (_this.vars.OriginalTitle == document.title)
                                 ? notification
                                 : _this.vars.OriginalTitle;
        }, (intervalSpeed) ? intervalSpeed : 500);
    },
    off: function(){
        clearInterval(this.vars.Interval);
        document.title = this.vars.OriginalTitle;   
    }
}

window.init = init;