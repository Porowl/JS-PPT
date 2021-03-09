import Stage from './Stage.js';
import TetView from './TetView.js';
import Storage from './Storage.js';
import Mino from './Mino.js';
import {socket} from '../main.js';

import {DRAWMODE,MOVES,KEYSTATES,LAST_MOVE,KEY,ENTRY_DELAY,DAS,ARR,OFFSETS,I_OFFSETS,PIECE_MAP,
	   LINE_CLEAR_FRAMES,CLEAR_STRINGS
	  } from '../constants.js';

export default class Player {
	constructor(myid) {
		this.user = myid;
		this.enemy;
		this.board = new Stage();
		this.view = new TetView(0);
		this.stg = new Storage(myid);
		this.random;
		this.gravity = this.stg.getGravity();
		this.piece = {};
		
		this.clearedLineArr = {};
		
		this.ghostSwitch = true;
		this.holdUsed = false;
		this.pieceHeld = false;
		
		this.initDelay = 0;
		this.lineClearDelay = -1;
		
		this.LRFrameCounter = 0;
		this.RotateFrameCounter = 0;
		this.dropRate = 0;
		
		this.phase = PHASE.NEW_BLOCK;
		this.gameOver = false;
		this.cycle = undefined;
		
		document.addEventListener('keydown', (event) => {
			this.stg.keyMap[event.keyCode] = true;
		});
		document.addEventListener('keyup', (event) => {
			switch(event.keyCode) {
				case 16:
				case 32:
				case 67:
					break;
				default:
					delete this.stg.keyMap[event.keyCode];
					break;
			}
		});
		
		let eventName = 'garbCountP'+this.user;
		
		socket.on(eventName,data=>{
			let lines = this.board.deductGarbage(data)
            this.view.showGarbage(this.board.garbage); 
			if(lines>0) {
				let eventName = 'attackFromP' + this.user;
				socket.emit(eventName,lines)
			}
		})
		
		eventName = 'attackOnP' + this.user;
		
		socket.on(`attackOnP${this.user}`,data=>
        {
            this.board.addGarbage(data);
            this.view.showGarbage(this.board.garbage); 
        });
	}

	countDown = () => {
		setTimeout(() => {
			this.view.countDown(3);
		}, 0);
		setTimeout(() => {
			this.view.countDown(2);
		}, 1000);
		setTimeout(() => {
			this.view.countDown(1);
		}, 2000);
		setTimeout(() => {
			this.view.countDown(0);
			this.gameStart();
		}, 3000);
	};

	gameStart = () => {
		this.updateNexts();
		this.updateScore();
	};

	update = (dt) => {
		switch (this.phase) {
			case PHASE.CLEAR_UPS: {
				if(!this.board.executeGarbage()) {
					this.phase == PHASE.GAME_OVER;
					return;
				};
				this.view.showGarbage(this.board.garbage); 
				let scoreArr = this.stg.updateLines(this.clearedLineArr, this.board.isEmpty());
				this.view.displayScoreArr(scoreArr);
				this.updateScore();
				
				this.phase = PHASE.NEW_BLOCK;
				break;
			}
				
			case PHASE.NEW_BLOCK: {
				this.view.draw(this.board.field);
				this.getNewPiece();
				//this.checkTopOut();
				this.moveDown();
				this.phase = PHASE.FALL;
				break;
			}
				
			case PHASE.FALL: {
				this.moveDownCycle(dt);
				this.inputCycle();
				this.updatePiece();

				if (!this.board.canMove(this.piece, 0, 1)) {
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
				break;
			}
				
			case PHASE.CLEAR_ANI: {
				if (this.lineClearDelay >= 0) {
					this.lineClearDelay--;
					for (var i = 0; i < this.clearedLineArr.length(); i++)
						this.view.clearAnimation(this.clearedLineArr.get(i), this.lineClearDelay);
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
			}
		}
	};

	getNewPiece = () => {
		this.piece = new Mino(this.random.getPiece(this.stg.getIndexInc()));
		this.view.drawHold(this.stg.hold, DRAWMODE.DRAWPIECE);
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
			piece.lastMove = LAST_MOVE.SPIN;
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
				this.view.drawHold(a, DRAWMODE.DRAWGHOST);
				this.stg.hold = a;
				this.piece = new Mino(temp);
			}
			this.holdUsed = true;
		}
		this.stg.keyMap[KEY.SHIFT] = false;
		this.stg.keyMap[KEY.C] = false;
	};

	hardDrop = () => {
		if (this.stg.keyMap[KEY.SPACE]) {
			var result = this.board.hardDrop(this.piece);
			this.view.hardDropAnimation(this.piece, this.board.garbage);
			this.stg.addDropScore(result * 2);
			this.piece.hardDropped = true;
			this.stg.keyMap[KEY.SPACE] = false;
			this.stg.keyMap[KEY.H] = false;
		}
	};

	lock = (piece) => {
		this.lockDelay = 0;
		this.dropRate = 0;
		this.clearedLineArr = this.board.lock(piece);
		this.lineClearDelay = this.clearedLineArr.length() == 0 ? 0 : LINE_CLEAR_FRAMES;
		this.view.lockAnimation(piece, 0, this.board.garbage);
	};

	updatePiece = () => {
		this.view.clearPiece();
		this.view.drawPiece(this.piece, DRAWMODE.DRAWGHOST, this.board.getGhostIndex(this.piece))
		this.view.drawPiece(this.piece, DRAWMODE.DRAWPIECE)
	}
	
	updateNexts = () => {
		this.view.refreshNexts();
		let arr = this.random.nextPieces(this.stg.getIndex());
		for (var i = 0; i < Math.max(this.stg.nexts, 6); i++) {
			this.view.drawNext(arr[i], i);
		}
	};

	updateScore = () => {
		this.view.displayScore(this.stg.scoreToText());
	};
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