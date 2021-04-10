import Board from './Board.js';
import Stats from './Stats.js';
import BubblingView from './BubblingView.js';
import Bubbling from './Bubbling.js';
import MultBubblings from './MultBubblings.js';

import {BUBBLING_SIZE, DIRECTION,KICK,BUBBLING_BOARD_WIDTH,KEY,BUBBLING_DAS,ARR,KEYSTATES,BUBBLING_STATE,POP_SPRITE,playSound,SOUNDS} from '../constants.js';
import {socket} from '../main.js';

export default class BubblingPlayer{
    constructor(user = 0) {
		this.user = user;
		this.Board = new Board();
		this.Stats = new Stats(user);
		this.View = new BubblingView(0);
		this.bubbling = {};
		this.calcData = {arr:[]};
		this.fallingBubblings = [];
		this.BBM = new BouncingBubblingManager();
		this.random = {};
		
		this.phase = PHASE.STAND_BY;
		this.LRFrameCounter = 0;
		this.DFrameCounter = 0;
		this.RotateFrameCounter = 0;
		this.dropRate = 0;
		this.lockDelay = 0;
		this.onBounceAnimation = false;
		
		this.View.drawBoard(this.Board);
		
		this.gameOver = false;
		
		this.eventTriggerNames = [ 
			'keydown',
			'keyup',
			'garbCount'
		];
		this.events = [
			//0
			(event) => {
				this.Stats.keyMap[event.keyCode] = true;
			},
			//1
			(event) => {
				switch(event.keyCode) {
					case 16:
					case 32:
					case 67:
						break;
					default:
						delete this.Stats.keyMap[event.keyCode];
						break;
				}
			},
			//2
			(event) => {
				let garbs = this.Board.deductGarbage(event.detail.n);
				let remaining = this.Board.garbage;
				if(this.Stats.vsTETROCKS){
					if(garbs!=0&&remaining==0) {
						socket.emit('sendAttack',event.detail.m);
					}
				} else if(garbs>0) {
					socket.emit('sendAttack',garbs);	
				}
			}
		];
		for(let i = 0; i<2;i++){
			document.addEventListener(this.eventTriggerNames[i],this.events[i]);
		}
	}
	
	initMultEvents = () => {
		document.addEventListener(this.eventTriggerNames[2],this.events[2]);
		socket.off('receiveAttack')
		socket.on('receiveAttack',data=> {
			this.Board.addGarbage(data);
			this.View.showGarbage(this.Board.getTotalGarb());
		});
		socket.off('fireGarb');
		socket.on('fireGarb',()=>{
			this.Board.queueGarbage();
		});
	}
	
	countDown = () => {
		let i = this.Stats.getIndex()
		let p1 = this.random.getBubbling(i);
		let p2 = this.random.getBubbling(i+1);
		this.View.drawNexts(p1,p2);
		this.View.displayScore(this.Stats.scoreToText());
		
		this.phase = PHASE.COUNTDOWN;
	};
	
    update = (dt) => {
		this.BBM.update();
		let bbmArr = this.BBM.getArr();
		if(bbmArr.length>0) {
			this.onBounceAnimation = true;
			if(this.View.bounceAnimation(bbmArr)) {
				this.BBM.cleanUp();
				this.onBounceAnimation = false;
			}
		};
        switch(this.phase) {
			case PHASE.COUNTDOWN:{
				if(!this.temp) this.temp = 4;
				if(!this.timeElapsed) this.timeElapsed = 1;
				let timeElapsed = this.timeElapsed += dt;
				if(timeElapsed>1){
					this.timeElapsed -= 1;
					this.View.countDown(--this.temp);
				}
				if(!this.temp) {
					delete this.temp;
					this.phase = PHASE.NEW_BUBBLING;
					this.Stats.setGameStarted();
				}
				break;
			}
			case PHASE.STAND_BY:
				break;
            case PHASE.DROP: {
				this.inputCycle(); 
				
				let keyDown = this.Stats.keyMap[KEY.DOWN];
				if(this.Board.valid(this.bubbling.getPos(DIRECTION.DOWN))){
					this.bubbling.moveDown(keyDown);
					if(keyDown){
						this.Stats.score += 1;
						this.View.displayScore(this.Stats.scoreToText());
					}
					this.lockDlay = 0;
				} else {
					if(keyDown){
						this.phase++;
					} else {
						this.lockDelay += dt;
					}
				}
				this.bubbling.updateLR();
				this.View.moveCycle(this.bubbling);
				
				if(this.lockDelay >= 0.533 && !this.Board.valid(this.bubbling.getPos(DIRECTION.DOWN))) {
					this.phase++;
				}
                break;
            }
            case PHASE.LOCK: {
				this.lockDelay = 0;
                this.Board.lockMult(this.bubbling)
				this.phase++;
				let bub = this.bubbling.mainPiece;
				if(!this.Board.validCell(bub.x,bub.y+1)) this.bounce(bub);
				bub = this.bubbling.subPiece;
				if(!this.Board.validCell(bub.x,bub.y+1)) this.bounce(bub);
                break;
            }
            case PHASE.FALL: {
                this.fallingBubblings = this.Board.fall();
                this.View.drawBoard(this.Board);
                this.phase++;
                break;
            }
			case PHASE.FALL_ANIMATION:{
				let counter = 0;
				for (let x = 0; x < BUBBLING_BOARD_WIDTH; x++) {
					for (let bubbling of this.fallingBubblings[x]) {
						if (bubbling) {
							if (!bubbling.fall()) counter++;
						}
					}
				}
				this.View.fallCycle(this.fallingBubblings);
                if(!counter > 0) this.phase++;
                break;
            }
            case PHASE.FALL_ANIMATION_END: {
				if(this.onBounceAnimation) break;
                for(let x = 0; x<BUBBLING_BOARD_WIDTH;x++) {
                    for(let Bubbling of this.fallingBubblings[x]) {
                        this.Board.lockSingle(Bubbling);
						this.bounce(Bubbling); 
                    }
                }
                //this.View.emptyArray();
				this.fallingBubblings.length = 0;
                this.View.drawBoard(this.Board);
                this.phase++;
                break;
            }
            case PHASE.CALC: {
				if(this.onBounceAnimation) break;
                this.View.drawBoard(this.Board);
                this.phase++;
                this.calcData = this.Board.calc();
                break;
            }
            case PHASE.POP: {
                this.View.popFrame = 0;
                if(this.calcData.arr.length>0) {
					let data = this.Stats.calcScore(this.calcData);
					this.View.displayScore(data)
                    this.Board.pop(this.calcData.arr);
                    this.View.drawBoard(this.Board);
                    this.phase++;
				} else {
					this.phase = PHASE.NEW_BUBBLING;
				}
                break;
            }
            case PHASE.POP_ANIMATION: {
                if(this.View.popCycle(this.calcData.arr)) {
					this.phase = PHASE.NEW_BUBBLING;
				}
	            this.View.showGarbage(this.Board.getTotalGarb());
                break;
            }
			case PHASE.GARB: {
                let arr = this.Board.executeGarbage();
				this.fallingBubblings = arr;
				this.garbDropped = true;
				this.View.showGarbage(this.Board.getTotalGarb())
				this.phase++;
				break;
			}
			case PHASE.GARB_FALL: {
				let counter = 0;
				for (let x = 0; x < BUBBLING_BOARD_WIDTH; x++) {
					for (let bubbling of this.fallingBubblings[x]) {
						if (bubbling) {
							if (!bubbling.fall()) counter++;
						}
					}
				}
				this.View.fallCycle(this.fallingBubblings);
                if(!counter > 0) this.phase++;
                break;
				break;
			}
            case PHASE.GARB_FALL_ANIMATION_END: {
				let arr = this.fallingBubblings;
				for(let x = 0; x<BUBBLING_BOARD_WIDTH;x++) {
					for(let Bubbling of arr[x]) {
						this.Board.lockSingle(Bubbling);
					}
				}
				this.View.drawBoard(this.Board);
				this.phase++;
                break;
            }
            case PHASE.NEW_BUBBLING: {
                if(this.calcData.arr.length>0){
					this.phase = PHASE.FALL; 
					break;
				}
				if(this.Board.garbage>0 && !this.garbDropped) {
					this.phase = PHASE.GARB; 
					break;
				}
				socket.emit('fireGarb');
				
				this.calcData.arr.length = 0;
				this.garbDropped = false;
				
				this.View.displayScore(this.Stats.scoreToText());
				
				if(this.Board.blocked()) {
					this.phase = PHASE.GAME_OVER;
					break;
				}
				
				this.Stats.resetChain();
				this.bubbling = this.getBubbling();
				
				let i = this.Stats.getIndex()
				let p1 = this.random.getBubbling(i);
				let p2 = this.random.getBubbling(i+1);
				this.View.drawNexts(p1,p2);

                this.View.popFrame = 0;
                this.phase = PHASE.DROP;
                break;
            }
            case PHASE.GAME_OVER: {
				this.phase = PHASE.STAND_BY;
				socket.emit('gameOver');
                break;   
            }
        }
        return true;
    }

	inputCycle = () => {
		this.moveLR();
		this.rotate();
	};

	moveLR = () => {
		let state = this.Stats.checkLR();
		if (state == KEYSTATES.LR || state == -1) {
			this.LRFrameCounter = 0;
		} else {
			let dir = state==KEYSTATES.L?DIRECTION.LEFT:DIRECTION.RIGHT;
			let offset = state==KEYSTATES.L?-1:1
			let fc = this.LRFrameCounter;
			if (fc == 0 || (fc >= BUBBLING_DAS && (fc - BUBBLING_DAS) % ARR == 0)) {
				if(this.Board.valid(this.bubbling.getPos(dir))){
					this.bubbling.move(offset,0);
				}
			}
			this.LRFrameCounter++;
		}
	}
	
	rotate = () => {
		let state = this.Stats.checkRot();
		if (state == KEYSTATES.UZ || state == -1) {
			this.RotateFrameCounter = 0;
		} else {
			if (this.RotateFrameCounter == 0) {
				let dir = state == KEYSTATES.U ? DIRECTION.CW : DIRECTION.ACW;
				let result = this.Board.validRotation(this.bubbling.getPos(),dir)
				if(result==KICK.NO_ROTATION) {
					if(this.bubbling.rotation%2==0) this.bubbling.tempRotation = 1;
				}
				else this.bubbling.rotate(dir, result);
			}
			this.RotateFrameCounter++;
		}
	};

    getBubbling = () => {
        const ranNum = this.random.getBubbling(this.Stats.getIndexInc());
        const p1 = ( ranNum & 0xc ) / 0x4;
        const p2 = ranNum % 0x4;
        return new MultBubblings(new Bubbling(p1),new Bubbling(p2))
    }
	
	setOpponent = type => {
		this.Stats.setOpponent(type);
	};

	bounce = (bub) => {
		this.BBM.addSingle(bub);
	}
}

const PHASE = {
	COUNTDOWN: -2,
	STAND_BY: -1,
    DROP: 0,
    LOCK: 1,
    FALL: 2,
    FALL_ANIMATION: 3,
    FALL_ANIMATION_END: 4,
    CALC: 5,
    POP:6,
    POP_ANIMATION:7,
	GARB:8,
	GARB_FALL:9,
	GARB_FALL_ANIMATION_END:10,
    NEW_BUBBLING:11,
    GAME_OVER:99
}

class BouncingBubblingManager {
	constructor() {
		this.arr = [];
	}
	
	addSingle = (bub) => {
		this.arr.push(new BouncingBubbling(bub.x,bub.y,bub.type));
	}
	
	addByData = (x,y,c) => {
		this.arr.push(new BouncingBubbling(x,y,c));		
	}

	addArr = arr => {
		this.arr.concat(arr);
	}
	
	getArr = () => {
		return this.arr;
	}
	
	update = () => {
		let p = false;
		for(let i = 0; i< this.arr.length; i++){
			let bubbling = this.arr[i];
			if(!bubbling) continue
			if(bubbling.update()) {
				delete this.arr[i]
				if(!p) p = true;
			};
		}
		if(p) playSound(SOUNDS.BUB_DROP);
	}
	
	cleanUp = () => {
		this.arr.length = 0;
	}
}

class BouncingBubbling {
	constructor(x,y,c){
		this.x = x;
		this.y = y;
		this.color = c;
		this.type = c
		this.state = 0
		this.frame = 0;
	}
	
	update = () => {
		let c = this.color;
		let f = ++this.frame;
		
		if(f<7){
			this.type = POP_SPRITE[c][0];
			this.state = POP_SPRITE[c][1];
		} else if (f<12) {
			this.type = POP_SPRITE[c][0];
			this.state = POP_SPRITE[c][1]+1;
		} else {
			this.type = c
			this.state = BUBBLING_STATE.N;
		}
		return f>12;
	}
}