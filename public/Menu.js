import {socket} from './main.js';
import {canvas3,ctx0,ctx1,ctx2,ctx3,TETRIS_BUTTON,PUYO_BUTTON,X_OFFSET,Y_OFFSET,BOARD_CENTER_X,BOARD_CENTER_Y} from './constants.js';

/***************Classes****************/
class Menu {
	constructor()
	{
		window.addEventListener('click',event => {
            let rect = canvas3.getBoundingClientRect();
			let ratio = rect.width/1024;
            let x = (event.clientX - rect.left) / ratio; 
            let y = (event.clientY - rect.top) / ratio; 
			this.currScreen.checkButtonClicked(x,y);
		});
		
		this.screens = [];
		this.currScreen;
	}
	
	changeScreenTo = name =>{
		ctx3.clearRect(0,0,1024,768)
		this.currScreen = this.screens[name]
		this.currScreen.onActive();
	}
	
	addScreen = screen => {
		this.screens[screen.name] = screen;
		screen.setContext(this);
	}
	
	init = () => {
		this.currScreen.draw();
	}
}

class MenuScreen {
	constructor(name) {
		this.name = name;
		this.buttons = [];
		this.objects = [];
		this.events = [];
		this.context;
		
		this.events.push(()=>{this.draw();});
	}
	
	onActive = () => {
		for(let func of this.events){
			func();
		}
	}
	
	addEvent = func => {
		this.events.push(func);
	}
	
	setContext = context => {
		this.context = context;
	}
	addButton = (button) => {
		this.buttons.push(button)
		button.setContext(this.context);
	}
	
	addObject = (object) => {
		this.objects.push(object);
	}
	
	checkButtonClicked = (x,y) => {
		for(let button of this.buttons) {
			if(button.isClicked(x,y)) {
				button.executeEvent();
			}
		}	
	}
	
	draw = () => {
		for(let object of this.objects){
			object.draw();
		}
		for(let button of this.buttons){
			button.draw();
		}
	}
}

class MenuButton {
	constructor(x,y,w,h,name) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.name = name;
		this.event = ()=>{};
		this.context;
		
		this.color = "rgba(150,150,150,0.3)";
		this.lineColor = "rgb(0,0,0)"
		this.textColor = "rgb(255,255,255)";
	}
	
	setContext = context => {
		this.context = context;
	}
	setEvent = event => {
		this.event = event;
	}
	
	isClicked = (x,y) => (x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y+this.h)

	executeEvent = () => {
		this.event();
	}
	
	draw = () => {
		let ctx = ctx3;
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x,this.y,this.w,this.h);
		
		ctx.lineWidth = 2;
		
		ctx.strokeStyle = this.lineColor;
		ctx.strokeRect(this.x,this.y,this.w,this.h);
		
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = "15px Kongtext";
		
		ctx.fillStyle = this.textColor;
		ctx.strokeStyle = this.lineColor;
		
		ctx.strokeText(this.name, this.x+this.w/2, this.y+this.h/2);
		ctx.fillText(this.name, this.x+this.w/2, this.y+this.h/2);
	}
}
/******************************************/
let menu = new Menu();

/***************EMPTY SCREEN****************/

	let empty = new MenuScreen('empty');
	menu.addScreen(empty);	


/***************MAIN  SCREEN****************/

let titleScreen = new MenuScreen('title')
menu.addScreen(titleScreen);

let title = {
	x : 1024/2,
    y : 768/4,
    draw : () => {
		let ctx = ctx3;
		ctx.fillStyle = "rgb(255,255,255)";
		ctx.font = "48px Kongtext";
		ctx.strokeStyle = "rgb(0,0,0)";
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = "75px Kongtext";
		ctx.lineWidth = 6;	
		ctx.strokeText("JSPPT",title.x,title.y+50);
		ctx.fillText("JSPPT",title.x,title.y+50);
	}
};
titleScreen.addObject(title);

let ButtonImages = {
	x : 1024/2-150,
	y : 768/2,
	draw : () =>{
 		ctx3.drawImage(TETRIS_BUTTON,ButtonImages.x,ButtonImages.y-50);
 		ctx3.drawImage(PUYO_BUTTON,ButtonImages.x,ButtonImages.y+55);
	}
}
titleScreen.addObject(ButtonImages);

let SelectTetris = new MenuButton(1024/2-150,768/2-50,300,100,'Play As TETRIS');
titleScreen.addButton(SelectTetris);

SelectTetris.setEvent(()=>{
	socket.emit('waiting','TETRIS');
	SelectTetris.context.changeScreenTo('empty');
});

let SelectPuyo = new MenuButton(1024/2-150,768/2+55,300,100,'Play As PUYO');
titleScreen.addButton(SelectPuyo);

SelectPuyo.setEvent(()=>{
	socket.emit('waiting','PUYO');
	SelectTetris.context.changeScreenTo('empty');
});
/***************READY SCREEN****************/
let readyScreen = new MenuScreen('ready');
menu.addScreen(readyScreen);

let ready = new MenuButton(X_OFFSET,Y_OFFSET+425,200,75,'READY');
	ready.status = false;
ready.setEvent(()=>{
	ready.status = ready.status ^ true;
	let eventName = ready.status?'ready':'cancel' 
	socket.emit(eventName);
});

readyScreen.addButton(ready);
readyScreen.addEvent(()=>{ready.status = false});

/***************RETURN SCREEN****************/
let returnToMain = new MenuScreen('returnToMain');
menu.addScreen(returnToMain);

let returnButton = new MenuButton(X_OFFSET,Y_OFFSET+500,200,75,'RETURN TO TITLE');
returnButton.setEvent(()=>{
	ctx0.clearRect(0,0,1024,768);
	ctx1.clearRect(0,0,1024,768);
	ctx2.clearRect(0,0,1024,768);
	ctx3.clearRect(0,0,1024,768);
	returnToMain.context.changeScreenTo('title')
	socket.emit('leaveRoom');
});
returnToMain.addButton(returnButton);

/***************REPLAY SCREEN****************/

let replayScreen = new MenuScreen('replay');
menu.addScreen(replayScreen);

let playAgain = new MenuButton(X_OFFSET,Y_OFFSET+425,200,75,'PLAY AGAIN');
playAgain.setEvent(()=>{
	socket.emit('playAgain');
	returnToMain.context.changeScreenTo('returnToMain')
});

replayScreen.addButton(playAgain);
replayScreen.addButton(returnButton);

export default menu;