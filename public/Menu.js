import {socket} from './main.js';
import {canvas3,ctx0,ctx1,ctx2,ctx3} from './constants.js';

export default class Menu {
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
		
		let temp = new MenuScreen('default');
		let tempButton = new MenuButton(10,10,60,30,'test');
		tempButton.setEvent(()=>{});
		
		temp.addButton(tempButton);
		temp.setContext(this);
		
		addScreen(temp);
		this.changeScreenTo('default');
	}
	
	changeScreenTo = name =>{
		this.currScreen = this.screens[name]
		this.currScreen.draw();
	}
	
	addScreen = screen => {
		this.screens[screen.name] = screen;
	}
}

class MenuScreen {
	constructor(name) {
		this.name = name;
		this.buttons = [];
		this.objects = [];
		this.context;
	}
	
	setContext = context => {
		this.context = context;
	}
	addButton = (button) => {
		this.buttons.push(button)
		button.setContext = this.context;
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
		for(let button of this.buttons){
			button.draw();
		}
		for(let object of this.objects){
			object.draw();
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
		
		this.color = "rgb(100,100,100)";
		this.textColor = "rgb(0,0,0)";
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
		ctx.strokeStyle = this.textColor;
		ctx.strokeRect(this.x,this.y,this.w,this.h);
		
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = "15px 'Press Start 2P'";
		
		ctx.fillStyle = this.textColor;
		ctx.strokeStyle = this.color;
		
		ctx.strokeText(this.name, this.x+this.w/2, this.y+this.h/2);
		ctx.fillText(this.name, this.x+this.w/2, this.y+this.h/2);
	}
}