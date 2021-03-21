import Board from './Board.js';
import Stats from './Stats.js';
import PuyoView from './PuyoView.js';
import Puyo from './Puyo.js';
import MultPuyos from './MultPuyos.js';

import {DIRECTION,KICK,PUYO_BOARD_WIDTH,KEY,PUYO_DAS,ARR,KEYSTATES} from '../constants.js';
import {socket} from '../main.js';

export default class PuyoPlayer{
    constructor(user = 0) {
		this.user = user;
		this.Board = new Board();
		this.Stats = new Stats(user);
		this.Puyo = {};
		this.popArr = {arr:[]};
		this.View = new PuyoView(0);
		this.random = {};
		
		this.phase = PHASE.NEW_PUYO;
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
		this.events =[
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
				if(this.Stats.vsTetris){
					if(garbs!=0&&remaining==0) {
						socket.emit(`attackFromP${this.user}`,event.detail.m);
					}
				} else if(garbs>0) {
					socket.emit(`attackFromP${this.user}`,garbs);	
				}
			}
		];
				
		for(let i = 0; i<this.eventTriggerNames.length;i++){
			document.addEventListener(this.eventTriggerNames[i],this.events[i]);
		}
		
		socket.off(`attackOnP${this.user}`)
		socket.on(`attackOnP${this.user}`,data=> {
			this.Board.addGarbage(data);
			this.View.showGarbage(this.Board.garbage); 
		});
	}

	gameStart = () => {
		this.Stats.setGameStarted();
	}
	
    update = (dt) => {
        switch(this.phase) {
			case PHASE.STAND_BY: {
				break;
			}
            case PHASE.DROP: {
                this.View.moveCycle();
				this.moveDownCycle(dt);
				this.inputCycle(); 

				if(!this.Board.valid(this.Puyo.getPos(DIRECTION.DOWN))){
					if(this.Stats.keyMap[KEY.DOWN]){
						this.phase++;
					} else {
						this.lockDelay += dt;
					}
				} else {
					this.lockDlay = 0;
				}
				
				if(this.lockDelay >= 0.533 && !this.Board.valid(this.Puyo.getPos(DIRECTION.DOWN))) {
					this.phase++;
				}
                break;
            }
            case PHASE.LOCK: {
				this.lockDelay = 0;
                this.Board.lockMult(this.Puyo)
				this.phase++;
				this.View.drawBoard(this.Board);
                break;
            }
            case PHASE.FALL: {
                let array = this.Board.fall();
                this.View.drawBoard(this.Board);
                this.View.fallingPuyos(array);
                this.phase++;
                break;
            }
			case PHASE.FALL_ANIMATION:{
                if(!this.View.fallCycle()) this.phase++;
                break;
            }

            case PHASE.FALL_ANIMATION_END: {
                let arr = this.View.getPuyoArr();

                for(let x = 0; x<PUYO_BOARD_WIDTH;x++) {
                    for(let puyo of arr[x]) {
                        this.Board.lockSingle(puyo);
                    }
                }
                this.View.emptyArray();
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
					this.phase = PHASE.NEW_PUYO;
				}
                break;
            }
            case PHASE.POP_ANIMATION: {
                if(this.View.popCycle(this.popArr.arr)) {
						this.phase = PHASE.NEW_PUYO;
				}
	            this.View.showGarbage(this.Board.garbage); 
                break;
            }
			case PHASE.GARB: {
                let arr = this.Board.executeGarbage();
				this.garbDropped = true;
				this.View.showGarbage(this.Board.garbage)
                this.View.fallingPuyos(arr);
				this.phase++;
				break;
			}
			case PHASE.GARB_FALL: {
                if(!this.View.fallCycle()) this.phase++;
				break;
			}
            case PHASE.GARB_FALL_ANIMATION_END: {
				let arr = this.View.getPuyoArr();

				for(let x = 0; x<PUYO_BOARD_WIDTH;x++) {
					for(let puyo of arr[x]) {
						this.Board.lockSingle(puyo);
					}
				}
				this.View.emptyArray();
				this.View.drawBoard(this.Board);
				this.phase++;
                break;
            }
            case PHASE.NEW_PUYO: {
                if(this.popArr.arr.length>0){this.phase = PHASE.FALL; break;}
                if(this.Board.garbage>0 && !this.garbDropped){this.phase = PHASE.GARB; break;}
				this.popArr.arr.length = 0;
				this.garbDropped = false;
				
				this.View.displayScore(this.Stats.scoreToText());

				if(this.Board.blocked()) {
					this.phase = PHASE.GAME_OVER;
					break;
				}
				
                this.Stats.resetChain();
                this.Puyo = this.getPuyo();

                this.View.emptyArray();
                this.View.addMultPuyo(this.Puyo);
				
				let i = this.Stats.getIndex()
				let p1 = this.random.getPuyo(i);
				let p2 = this.random.getPuyo(i+1);
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
			if (fc == 0 || (fc >= PUYO_DAS && (fc - PUYO_DAS) % ARR == 0)) {
				if(this.Board.valid(this.Puyo.getPos(dir))){
					this.Puyo.move(offset,0);
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
				let dir = state == KEYSTATES.U ? DIRECTION.ACW : DIRECTION.CW;
				let result = this.Board.validRotation(this.Puyo.getPos(),dir)
				if(result==KICK.NO_ROTATION) {
					if(this.Puyo.rotation%2==0) this.Puyo.tempRotation = 1;
				}
				else this.Puyo.rotate(dir, result);
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
		if(this.Board.valid(this.Puyo.getPos(DIRECTION.DOWN))){
			this.Puyo.move(0,1);
			return true;
		}
		return false;
	}

    getPuyo = () =>
    {
        const ranNum = this.random.getPuyo(this.Stats.getIndexInc());
        const p1 = ( ranNum & 0xc ) / 0x4;
        const p2 = ranNum % 0x4;
        return new MultPuyos(new Puyo(p1),new Puyo(p2))
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
    NEW_PUYO:11,

    GAME_OVER:99
}