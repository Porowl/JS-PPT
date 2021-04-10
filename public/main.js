export let socket = io();
import TetPlayer from './Tetrocks/TetPlayer.js';
import TetView from './Tetrocks/TetView.js';
import BubblingPlayer from './Bubblings/BubblingPlayer.js';
import BubblingView from './Bubblings/BubblingView.js';
import Randomizer from './Randomizer.js'
// import menu from './Menu.js';

import {canvas0, canvas1, canvas2, canvas3, ctx0, ctx1, ctx2, ctx3, GAME_STATE,playSound,SOUNDS,AudioVolumeManager} from './constants.js';

//
let established = false;
let requestId;
let keySettings = () => {};

//
let Player;
let EnemyView;
let myType;
let enemyType;

// 
let mode;
let ready;

const init = () => {
	window.addEventListener('focus',()=>{
		document.title = 'JS-PPT';
		PageTitleNotification.off();
	});
	
	initMenus();
	
	let counter = document.getElementById('playerCounter');
	socket.on('currPlayers',data=>{
		counter.innerText = data + ' player' + (data>1?'s are':' is') + ' currently online';
	});

	socket.on('connected', () => {
		if(established) return;
		established = true;
		// GUI = menu;
		socket.emit('load_complete')
	});
	
	socket.on('create',type=>{
		resetPlayer(Player);
		
		myType = type;
		Player = myType==='BUBBLING'?new BubblingPlayer(socket.id):new TetPlayer(socket.id);
		Player.initMultEvents();
		ready = false;
		// GUI.changeScreenTo('returnToMain')
	});

	socket.on('oppJoined', type =>{
		enemyType = type;
		EnemyView = enemyType === 'BUBBLING'?new BubblingView(1):new TetView(1);
		
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
		// GUI.changeScreenTo('ready');
	});

	socket.on('countdown', ()=>{
		// GUI.changeScreenTo('empty');
		Player.countDown();
		GameCycle.on();
		setTimeout(()=>{EnemyView.countDown(3)},0);
		setTimeout(()=>{EnemyView.countDown(2)},1000);
		setTimeout(()=>{EnemyView.countDown(1)},2000);
		setTimeout(()=>{EnemyView.countDown(0)},3000);
	})
	
	socket.on('eview', data =>{
		let call = data.name;
		if(!EnemyView[call]) {console.log(`${call} is not found!`); return;}
		Array.isArray(data.args)?EnemyView[call](...data.args):EnemyView[call](data.args);
	})
	
	socket.on('enemyAud',data=>{
		playSound(data,false);
	});
	
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
		GameCycle.off();
	});
	
	socket.on('GAME_OVER',id=>{
		let a = (id==socket.id)?GAME_STATE.LOST:GAME_STATE.WIN;
		let b = (id==socket.id)?GAME_STATE.WIN:GAME_STATE.LOST;
		Player.View.display(a);
		EnemyView.display(b);
		GameCycle.off();
	});
	
	socket.on('reset',seed=>{
		if(mode==1){
			resetPlayer(Player);
			Player = myType==='BUBBLING'?new BubblingPlayer(socket.id):new TetPlayer(socket.id);
			EnemyView = enemyType === 'BUBBLING'?new BubblingView(1):new TetView(1);
			Player.initMultEvents();
			Player.random = new Randomizer(seed);
			EnemyView.preview = true;
			Player.setOpponent(enemyType);
			Player.View.display();
			EnemyView.display();			
		} else if(mode==0) {
			singlePlayerGameOver();
		}
	})
};
const hide = item => item.classList.add('hidden');
const show = item => item.classList.remove('hidden');

const initMenus = () => {
	let menus = document.getElementById('menu');
	let menuWrapper = document.getElementById('menuWrapper');
	let igmenus = document.getElementById('ingameMenu');
	let mult = document.getElementById('multPlayer');
	let sing = document.getElementById('singlePlayer');
	let sett = document.getElementById('settings');
	let red = document.getElementById('ready');
	let ret = document.getElementById('return');
	let playAgain = document.getElementById('playAgain');
	let selectBoardText = document.getElementById('selectBoardText');

	let PasT = document.getElementById('PasT');
	let PasB = document.getElementById('PasB');
	
	mult.addEventListener('click',()=>{
		mode = 1;
		selectBoardText.innerText = 'SELECT YOUR BOARD TO COMPETE WITH:';
		menuWrapper.classList.add('scrollLeft');
	});
	sing.addEventListener('click',()=>{
		mode = 0;
		selectBoardText.innerText = 'SELECT YOUR BOARD TO PRACTICE:';
		menuWrapper.classList.add('scrollLeft');
	});
	sett.addEventListener('click',()=>{
		menuWrapper.classList.add('scrollRight');
	});
	PasT.addEventListener('click',()=>{
		hide(menus);
		show(igmenus)
		hide(red);
		hide(playAgain);
		menuWrapper.classList.remove('scrollLeft');
		if(mode) socket.emit('waiting','TETROCKS'});
		else playSinglePlayer('TETROCKS');
	});
	PasB.addEventListener('click',()=>{
		hide(menus);
		show(igmenus)
		hide(red);
		hide(playAgain);
		menuWrapper.classList.remove('scrollLeft');
		if(mode) socket.emit('waiting','BUBBLING');
		else playSinglePlayer('BUBBLING');
	})
	red.addEventListener('click', () => {
		if(mode==1){
			ready = ready ^ true;
			let eventName = ready ?'ready':'cancel' 
			socket.emit(eventName);			
		} else if (mode==0) {
			startSinglePlayer();
		}
	})
	ret.addEventListener('click', () => {
		if(mode==1) {
			socket.emit('leaveRoom');
		} else {
			singlePlayerGameOver();	   
		}
		ctx0.clearRect(0,0,1024,768);
		ctx1.clearRect(0,0,1024,768);
		ctx2.clearRect(0,0,1024,768);
		ctx3.clearRect(0,0,1024,768);
		hide(igmenus);
		show(menus);
	})
	socket.on('oppJoined',()=>show(red));
	socket.on('countdown',()=>hide(igmenus));
	socket.on('GAME_OVER',()=>{
		hide(red);
		show(playAgain);
		show(igmenus);
	});
	socket.on('oppDisconnected',()=>{
		hide(red);
		show(playAgain);
		show(igmenus);
	});
	socket.on('reset'),()=>{
		show(red);
		hide(playAgain);
	}
}

const resetPlayer = () =>{
	if(Player){
		let eventNames = Player.eventTriggerNames;
		let events = Player.events;
		
		for(let i = 0; i<eventNames.length;i++){
			document.removeEventListener(eventNames[i],events[i]);
		}
		Player = null;
	}
}

const playSinglePlayer = (mode) => {
	resetPlayer();
	myType = mode;
	Player = myType ==='BUBBLING'?new BubblingPlayer(socket.id):new TetPlayer(socket.id);
	Player.random = new Randomizer(Math.random().toString(36).substr(2,11));
	Player.View.preview = true;
	show(document.getElementById('ready'));
}

const startSinglePlayer = () => {
	resetPlayer();
	Player = myType==='BUBBLING'?new BubblingPlayer(socket.id):new TetPlayer(socket.id);
	Player.random = new Randomizer(Math.random().toString(36).substr(2,11));
	Player.View.preview = true;
	hide(document.getElementById('ready'));
	Player.countDown();
	GameCycle.on();
}

const singlePlayerGameOver = () => {
	GameCycle.off();
	resetPlayer();
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

const GameCycle = {
	vars: {
		cycle:null,
		last:0,
		now:0,
	},
	on: function() {
		this.vars.cycle = setInterval(()=>{update();},1000/60);
		this.vars.last = this.vars.now = Date.now();
	},
	off: function() {
		clearInterval(this.vars.cycle);
	},
	dt: function() {
		let now = this.vars.now = Date.now();
		let dt = now - this.vars.last;
		this.vars.last = now;
		return dt/1000;
	}
}

const update = () => {
	if(Player) Player.update(GameCycle.dt());
}

const SetVolume = value => {
	AudioVolumeManager.vars.volume = value/100;
	playSound(SOUNDS.COMBO1, false)
}

window.init = init;
window.SetVolume = SetVolume;