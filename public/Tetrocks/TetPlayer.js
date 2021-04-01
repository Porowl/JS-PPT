import Stage from './Stage.js';
import TetView from './TetView.js';
import Storage from './Storage.js';
import Mino from './Mino.js';
import {socket} from '../main.js';

import {DRAWMODE,MOVES,KEYSTATES,LAST_MOVE,KEY,ENTRY_DELAY,DAS,ARR,OFFSETS,I_OFFSETS,PIECE_MAP,
	   LINE_CLEAR_FRAMES,CLEAR_STRINGS,SOUNDS,playSound,ACTION_LOCKDELAY_REFRESH_MAX
	  } from '../constants.js';

export default class Player {
	constructor(myid) {
		this.user = myid;
		this.board = new Stage();
		this.View = new TetView(0);
		this.stg = new Storage(myid);
		this.random;
		this.gravity = this.stg.getGravity();
		this.piece = {};
		
		this.View.draw(this.board.field);
		
		this.clearedLineArr = {};
		
		this.ghostSwitch = true;
		this.holdUsed = false;
		this.pieceHeld = false;
		
		this.initDelay = 0;
		this.lineClearDelay = -1;
		
		this.LRFrameCounter = 0;
		this.RotateFrameCounter = 0;
		this.dropRate = 0;
		this.lockDelay = 0;
		this.lockDelayRefreshed = 0;
		this.lockDelayRefreshedCount = 0;
		
		this.phase = PHASE.NEW_BLOCK;
		this.gameOver = false;
		this.cycle = undefined;
		
		this.eventTriggerNames = [
			'keydown',
			'keyup',
			'garbCount',
			'AddGauge'
		];
		this.events = [
			//0
			(event) => {
				this.stg.keyMap[event.keyCode] = true;
			},
			//1
			(event) => {
				switch(event.keyCode) {
					case 16:
					case 32:
					case 67:
						break;
					default:
						delete this.stg.keyMap[event.keyCode];
						break;
				}
			},
			//2
			(event) => {
				let lines = this.board.deductGarbage(event.detail.n)
				if(lines>0) {
					socket.emit('sendAttack',lines);
					socket.emit('fireGarb');
				}
			},
			//3
			(event) => {
				let lines = this.board.addGauge(event.detail.n,event.detail.m);
				this.updateGauge();
			}
		];
		
		for(let i = 0; i<this.eventTriggerNames.length;i++){
			document.addEventListener(this.eventTriggerNames[i],this.events[i]);
		}
		
		socket.off('receiveAttack');
		socket.on('receiveAttack',data=>
		{
			this.board.addGarbage(data);
			if(this.stg.vsBubbling) this.board.deductGauge();
			this.View.showGarbage(this.board.getTotalGarb());
			if(this.stg.vsBubbling) this.updateGauge();
		});
		socket.off('fireGarb');
		socket.on('fireGarb',()=>{
			this.board.queueGarbage();
			this.View.showGarbage(this.board.getTotalGarb());
		});
	}

	setOpponent = type => {
		this.stg.setOpponent(type);
		if(this.stg.vsBubbling) this.updateGauge();
	};

	countDown = () => {
		this.updateNexts();
		this.updateScore();
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
		}, 3000);
	};

	update = (dt) => {
		switch (this.phase) {
			case PHASE.STANDBY:{
				break;
			}
			case PHASE.CLEAR_UPS: {
				let scoreArr = this.stg.updateLines(this.clearedLineArr, this.board.isEmpty());
				this.View.displayScoreArr(scoreArr);
				this.updateScore();
				
				this.phase = PHASE.NEW_BLOCK;
				break;
			}
				
			case PHASE.NEW_BLOCK: {
				//if not on chain send garbage to bubbling
				if(!this.board.executeGarbage(this.stg.vsBubbling)) {
					this.phase = PHASE.GAME_OVER;
					return;
				};					
				if(this.stg.vsBubbling && this.stg.isComboBroken()) {
					this.stg.executeGauge(this.board.resetGauge())
					this.updateGauge();
				}
				this.View.showGarbage(this.board.getTotalGarb());
				this.View.draw(this.board.field);
				this.getNewPiece();
				if(!this.board.canMove(this.piece,0,0)) {
					this.phase = PHASE.GAME_OVER;
					return;
				}
				this.moveDown();
				this.phase = PHASE.FALL;
				break;
			}
				
			case PHASE.FALL: {
				this.moveDownCycle(dt);
				this.inputCycle(); 

				if (!this.board.canMove(this.piece, 0, 1) && this.lockDelayRefreshed == 1 && this.lockDelayRefreshedCount < ACTION_LOCKDELAY_REFRESH_MAX) {
					this.lockDelay = 0;
					this.lockDelayRefreshed = 0;
					this.lockDelayRefreshedCount += 1;
				}
				else if (!this.board.canMove(this.piece, 0, 1)) {
					this.lockDelay += dt;
				} else {
					this.lockDelay = 0;
				}

				if (
					(this.piece.hardDropped || this.lockDelay > 0.5) &&
					!this.board.canMove(this.piece, 0, 1)
				) {
					this.phase = PHASE.LOCK;
				}
				break;
			}
				
			case PHASE.LOCK: {
				this.lock(this.piece);
				this.phase = PHASE.CLEAR_ANI;
				if(this.clearedLineArr.topOut) this.phase = PHASE.GAME_OVER;
				break;
			}
				
			case PHASE.CLEAR_ANI: {
				if (this.lineClearDelay >= 0) {
					for (var i = 0; i < this.clearedLineArr.length(); i++) {
						this.View.clearAnimation(this.clearedLineArr.get(i), this.lineClearDelay);
					}
					this.lineClearDelay--;
				} else {
					this.phase = PHASE.CLEAR;
				}
				break;
			}
				
			case PHASE.CLEAR: {
				for (var i = 0; i < this.clearedLineArr.length(); i++) {
					this.board.clearLine(this.clearedLineArr.get(i));
				}
				
				this.phase = PHASE.CLEAR_UPS;
				break;
			}
				
			case PHASE.GAME_OVER:{
				this.phase = PHASE.STANDBY;
				socket.emit('gameOver')
				playSound(SOUNDS.GAMEOVER);
				break;
			}
		}
	};

	getNewPiece = () => {
		let index = this.stg.getIndexInc();
		this.piece = new Mino(this.random.getPiece(index));
		this.View.drawHold(this.stg.hold, DRAWMODE.DRAWPIECE);
		this.updatePiece();
		this.updateNexts();
		this.gravity = this.stg.getGravity();
		this.holdUsed = false;
		this.dropRate = - ENTRY_DELAY * 0.016;
	};

	inputCycle = () => {
		this.moveLR();
		this.rotate();
		this.hold();
		this.hardDrop();
	};

	moveDownCycle = (dt) => {
		if (this.stg.keyMap[KEY.DOWN] && this.gravity > 2 / 60) {
			if (this.moveDown()) {
				this.stg.addDropScore(1);
				this.updateScore();
			}
			return;
		}
		this.dropRate += dt;
		while (this.dropRate > this.gravity) {
			this.dropRate -= this.gravity;
			this.moveDown();
		}
	};

	moveDown = () => {
		if (this.board.canMove(this.piece,0,1)) {
			this.piece.move(0,1);
			playSound(SOUNDS.MOVE);
			this.updatePiece();
			return true;
		}
		return false;
	};

	moveLR = () => {
		let p;
		let state = this.stg.checkLR();

		if (state == KEYSTATES.LR || state == -1) {
			this.LRFrameCounter = 0;
		} else {
			let dir = state==KEYSTATES.L?-1:1;
			let fc = this.LRFrameCounter;
			
			if (fc == 0 || (fc >= DAS && (fc - DAS) % ARR == 0)) {
				if(this.board.canMove(this.piece,dir,0)) {
					this.piece.move(dir,0);
					this.lockDelayRefreshed = 1;
					playSound(SOUNDS.MOVE);
					this.updatePiece();
				}
			}
			this.LRFrameCounter++;
		}
	};

	rotate = () => {
		let state = this.stg.checkRot();
		if (state == KEYSTATES.UZ || state == -1) {
			this.RotateFrameCounter = 0;
		} else {
			if (this.RotateFrameCounter == 0) {
				state == KEYSTATES.U ? this.rotateAc(1) : this.rotateAc(3);
			}
			this.RotateFrameCounter++;
		}
	};

	rotateAc = dir => {
		const piece = this.piece
		let p = new Mino(piece.typeId);
		p.x = piece.x;
		p.y = piece.y;
		p.rotation = piece.rotation;
		p.rotate(dir);
		
		let mode = dir===1 ? 0 : 1;
		
		let test = 0;
		let dx = 0, dy = 0;
		do {
			dx =     (piece.typeId == 5 ? I_OFFSETS : OFFSETS)[piece.rotation + mode * 4][test][0];
			dy = 0 - (piece.typeId == 5 ? I_OFFSETS : OFFSETS)[piece.rotation + mode * 4][test][1]; 
			test++;
		} while (!this.board.canMove(p, dx, dy) && test < 5);
		
		if(this.board.canMove(p, dx, dy)) {
			piece.move(dx,dy);
			piece.rotate(dir);
			this.updatePiece();
			piece.lastMove = LAST_MOVE.SPIN;
			this.lockDelayRefreshed = 1;
			playSound(SOUNDS.CHANGE);
		}
	};

	hold = () => {
		const piece = this.piece;
		if (!this.stg.checkHold()) return;
		if (!this.holdUsed) {
			if (!this.pieceHeld) {
				this.pieceHeld = true;
				this.stg.hold = piece.typeId;
				this.getNewPiece();
			} else {
				var temp = this.stg.hold;
				var a = piece.typeId;
				this.View.drawHold(a, DRAWMODE.DRAWGHOST);
				this.stg.hold = a;
				this.piece = new Mino(temp);
			}
			this.updatePiece();
			this.holdUsed = true;
			playSound(SOUNDS.HOLD.play);
		}
		this.stg.keyMap[KEY.SHIFT] = false;
		this.stg.keyMap[KEY.C] = false;
	};

	hardDrop = () => {
		if (this.stg.keyMap[KEY.SPACE]) {			
			var result = this.board.hardDrop(this.piece);
			this.updatePiece();
			this.View.hardDropAnimation(this.piece, this.board.garbage);
			this.stg.addDropScore(result * 2);
			this.piece.hardDropped = true;
			this.stg.keyMap[KEY.SPACE] = false;
			this.stg.keyMap[KEY.H] = false;
			playSound(SOUNDS.HARDDROP);
		}
	};

	lock = (piece) => {
		this.lockDelay = 0;
		this.lockDelayRefreshedCount = 0;
		this.dropRate = 0;
		this.clearedLineArr = this.board.lock(piece);
		this.lineClearDelay = this.clearedLineArr.length() == 0 ? 0 : LINE_CLEAR_FRAMES;
		this.View.lockAnimation(piece, 0, this.board.garbage);
	};

	updatePiece = () => {
		this.View.clearPiece();
		this.View.drawPiece(this.piece, DRAWMODE.DRAWGHOST, this.board.getGhostIndex(this.piece))
		this.View.drawPiece(this.piece, DRAWMODE.DRAWPIECE)
	}
	
	updateNexts = () => {
		let arr = this.random.nextPieces(this.stg.getIndex());
		for (var i = 0; i < Math.max(this.stg.nexts, 6); i++) {
			this.View.drawNext(arr[i], i);
		}
	};

	updateScore = () => {
		this.View.displayScore(this.stg.scoreToText());
	};

	updateGauge = () => {		
		this.View.displayGauge(this.board.gauge);
	}
}

const PHASE = {
	STANDBY: -1,
	CLEAR_UPS: 0,
	NEW_BLOCK: 1,
	FALL: 2,
	LOCK: 3,
	CLEAR_ANI: 4,
	CLEAR: 5,
	
	GAME_OVER: 99
};