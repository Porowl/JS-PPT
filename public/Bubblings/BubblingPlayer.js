import Board from './Board.js';
import Stats from './Stats.js';
import BubblingView from './BubblingView.js';
import Bubbling from './Bubbling.js';
import MultBubblings from './MultBubblings.js';

import {DIRECTION,KICK,BUBBLING_BOARD_WIDTH,KEY,BUBBLING_DAS,ARR,KEYSTATES} from '../constants.js';
import {socket} from '../main.js';

export default class BubblingPlayer{
    constructor(user = 0) {
		this.user = user;
		this.Board = new Board();
		this.Stats = new Stats(user);
		this.View = new BubblingView(0);
		this.bubbling = {};
		this.popArr = {arr:[]};
		this.fallingBubblings = [];
		this.random = {};
		
		this.phase = PHASE.NEW_BUBBLING;
		this.LRFrameCounter = 0;
		this.DFrameCounter = 0;
		this.RotateFrameCounter = 0;
		this.dropRate = 0;
		this.lockDelay = 0;
		this.gravity = 16/60
		
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
				
		for(let i = 0; i<this.eventTriggerNames.length;i++){
			document.addEventListener(this.eventTriggerNames[i],this.events[i]);
		}
		
		socket.off('receiveAttack')
		socket.on('receiveAttack',data=> {
			this.Board.addGarbage(data);
			this.View.showGarbage(this.Board.garbage); 
		});
		socket.off('fireGarb');
		socket.on('fireGarb',()=>{
			if(this.Board.garbage>0) this.Stats.fireGarb();
		});
	}
	
	countDown = () => {
		
		let i = this.Stats.getIndex()
		let p1 = this.random.getBubbling(i);
		let p2 = this.random.getBubbling(i+1);
		this.View.drawNexts(p1,p2);
		
		this.View.displayScore(this.Stats.scoreToText());
		
		setTimeout(() => {
			this.View.countDown(3);
		}, 0);
		setTimeout(() => {
			this.View.countDown(2);
		}, 1000);
		setTimeout(() => {
			this.View.countDown(1);
		}, 2000);
		setTimeout(() => {
			this.View.countDown(0);
			this.Stats.setGameStarted();
		}, 3000);
	};
	
    update = (dt) => {
        switch(this.phase) {
			case PHASE.STAND_BY: {
				break;
			}
            case PHASE.DROP: {
                //this.View.moveCycle();
				
				this.bubbling.update();
				this.View.moveCycle(this.bubbling);
				
				this.moveDownCycle(dt);
				this.inputCycle(); 

				if(this.Board.valid(this.bubbling.getPos(DIRECTION.DOWN))){
					this.lockDlay = 0;
				} else {
					if(this.Stats.keyMap[KEY.DOWN]){
						this.phase++;
					} else {
						this.lockDelay += dt;
					}
				}
				
				if(this.lockDelay >= 0.533 && !this.Board.valid(this.bubbling.getPos(DIRECTION.DOWN))) {
					this.phase++;
				}
                break;
            }
            case PHASE.LOCK: {
				this.lockDelay = 0;
                this.Board.lockMult(this.bubbling)
				this.phase++;
				this.View.drawBoard(this.Board);
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
                for(let x = 0; x<BUBBLING_BOARD_WIDTH;x++) {
                    for(let Bubbling of this.fallingBubblings[x]) {
                        this.Board.lockSingle(Bubbling);
                    }
                }
                //this.View.emptyArray();
				this.fallingBubblings.length = 0;
                this.View.drawBoard(this.Board);
                this.phase++;
                break;
            }
            case PHASE.CALC: {
                this.phase++;
                this.popArr = this.Board.calc();
                break;
            }
            case PHASE.POP: {
                this.View.popFrame = 0;
                if(this.popArr.arr.length>0) {
					let data = this.Stats.calcScore(this.popArr);
					this.View.displayScore(data)
                    this.Board.pop(this.popArr.arr);
                    this.View.drawBoard(this.Board);
                    this.phase++;
				} else {
					this.phase = PHASE.NEW_BUBBLING;
				}
                break;
            }
            case PHASE.POP_ANIMATION: {
                if(this.View.popCycle(this.popArr.arr)) {
					this.phase = PHASE.NEW_BUBBLING;
				}
	            this.View.showGarbage(this.Board.garbage); 
                break;
            }
			case PHASE.GARB: {
                let arr = this.Board.executeGarbage();
				this.fallingBubblings = arr;
				this.garbDropped = true;
				this.View.showGarbage(this.Board.garbage)
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
                if(this.popArr.arr.length>0){
					this.phase = PHASE.FALL; 
					break;
				}
				if(this.Board.garbage>0 && !this.garbDropped && this.Stats.isChainFinished()) {
					this.phase = PHASE.GARB; 
					break;
				}
				socket.emit('fireGarb');	
				
				this.popArr.arr.length = 0;
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

	moveLR = () =>{
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

	moveDownCycle = (dt) => {
		if(this.Stats.keyMap[KEY.DOWN]) {
			if(this.DFrameCounter%ARR==0){
				if (this.moveDown()) {
					this.Stats.score += 1;
					this.View.displayScore(this.Stats.scoreToText());
				}				
			}
			this.DFrameCounter++;
			return;
		}
		this.dropRate += dt;
		while (this.dropRate > this.gravity) {
			this.dropRate -= this.gravity;
			this.moveDown();
		}
	};

	moveDown = () => {
		if(this.Board.valid(this.bubbling.getPos(DIRECTION.DOWN))){
			this.bubbling.move(0,1);
			return true;
		}
		return false;
	}

    getBubbling = () =>
    {
        const ranNum = this.random.getBubbling(this.Stats.getIndexInc());
        const p1 = ( ranNum & 0xc ) / 0x4;
        const p2 = ranNum % 0x4;
        return new MultBubblings(new Bubbling(p1),new Bubbling(p2))
    }
	
	setOpponent = type => {
		this.Stats.setOpponent(type);
	};
}

const PHASE = 
{
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