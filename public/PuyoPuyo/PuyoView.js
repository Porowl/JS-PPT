import view from '../view.js';
import {socket} from '../main.js';

import {
	X_OFFSET,
	Y_OFFSET,
	PUYO_BOARD_WIDTH,
	PUYO_BOARD_HEIGHT,
	PUYO_VISIBLE_HEIGHT,
	SPRITE_IMAGE,
	PUYO_TYPE,
	PUYO_SIZE,
	POP_SPRITE,
	PLAYER_OFFSET,
	COLOR_WHITE,
	COLOR_GREY,
} from '../constants.js';

export default class PuyoView extends view {
	constructor(player) {
		super();
		this.player = player;
		this.offset = PLAYER_OFFSET*this.player;
		this.puyoArr = [];
		this.popFrame = 0;
		this.initGraphics();
		this.preview = false;
	}
	/**
	 * 무대를 그립니다.
	 */
	initGraphics = () => {
		let ctx = this.boardCtx;
		ctx.font = "16px 'Press Start 2P'";
		ctx.fillStyle = COLOR_WHITE;
		ctx.textBaseline = 'top';
		ctx.textAlign = 'center';

		// BOARD
		this.callDrawOutline(
			X_OFFSET,
			Y_OFFSET,
			X_OFFSET + PUYO_BOARD_WIDTH * PUYO_SIZE,
			Y_OFFSET + PUYO_VISIBLE_HEIGHT * PUYO_SIZE
		);
		
		ctx = this.infoCtx;
		
		ctx.fillText('WAITING',
					X_OFFSET+this.offset+PUYO_BOARD_WIDTH*PUYO_SIZE/2,
					 Y_OFFSET+(PUYO_VISIBLE_HEIGHT-1)*PUYO_SIZE/2)
		ctx.fillText('FOR',
					X_OFFSET+this.offset+PUYO_BOARD_WIDTH*PUYO_SIZE/2,
					 Y_OFFSET+PUYO_VISIBLE_HEIGHT*PUYO_SIZE/2)
		ctx.fillText('OPPONENT',
					X_OFFSET+this.offset+PUYO_BOARD_WIDTH*PUYO_SIZE/2,
					 Y_OFFSET+(PUYO_VISIBLE_HEIGHT+1)*PUYO_SIZE/2)
	};

	addPuyo = (puyo) => {
		this.puyoArr.push(puyo);
	};

	fallingPuyos = (arr) => {
		this.puyoArr = arr;
	};

	addMultPuyo = (multPuyo) => {
		this.puyoArr = multPuyo;
	};

	emptyArray = () => (this.puyoArr.length = 0);

	getPuyoArr = () => this.puyoArr;

	drawBoard = (board) => {
		this.boardCtx.clearRect(X_OFFSET+this.offset+1, Y_OFFSET+1, PUYO_BOARD_WIDTH * PUYO_SIZE, PUYO_VISIBLE_HEIGHT * PUYO_SIZE);
		for (var i = 0; i < PUYO_BOARD_WIDTH; i++) {
			for (var j = 1; j < PUYO_BOARD_HEIGHT; j++) {
				let x = X_OFFSET + i * PUYO_SIZE + 1 + this.offset;
				let y = Y_OFFSET + (j - 1) * PUYO_SIZE + 1;

				let color = board.table[j][i];
				if (color != PUYO_TYPE.EMPTY) {
					let color = board.table[j][i];
					let state = board.getState(i,j);
					this.drawPuyoByPointer(x, y, state, color, board, CTX_NUM.BOARD);
				}
				this.boardCtx.lineWidth = 1;
				this.boardCtx.strokeStyle = "rgb(0,0,0)"
				this.boardCtx.strokeRect(x, y, PUYO_SIZE, PUYO_SIZE);
			}
		}
		if(!this.preview){
			socket.emit('graphics',{
				name:'drawBoard',
				args:board
			})			
		}
	};

	moveCycle = () => {
		this.pieceCtx.clearRect(X_OFFSET+this.offset+1, 0+1, PUYO_BOARD_WIDTH * PUYO_SIZE, PUYO_VISIBLE_HEIGHT * PUYO_SIZE);

		let main = this.puyoArr.mainPiece;
		let sub = this.puyoArr.subPiece;

		main.move();
		sub.moveRotate(main.gX, main.gY);

		this.drawPuyo(main, CTX_NUM.PIECE);
		this.drawPuyo(sub, CTX_NUM.PIECE);
	};

	fallCycle = () => {
		let counter = 0;
		this.pieceCtx.clearRect(X_OFFSET+this.offset+1, Y_OFFSET+1, PUYO_BOARD_WIDTH * PUYO_SIZE, PUYO_VISIBLE_HEIGHT * PUYO_SIZE);
		for (let x = 0; x < PUYO_BOARD_WIDTH; x++) {
			for (let puyo of this.puyoArr[x]) {
				if (puyo) {
					if (!puyo.fall()) counter++;
					this.drawPuyo(puyo, CTX_NUM.PIECE);
				}
			}
		}
		return counter > 0;
	};

	popCycle = (arr) => {
		if (arr.length == 0) return true;
		this.popFrame++;

		let frame = 4;
		this.pieceCtx.clearRect(X_OFFSET+this.offset+1, Y_OFFSET+1, PUYO_BOARD_WIDTH * PUYO_SIZE, PUYO_VISIBLE_HEIGHT * PUYO_SIZE);
		for (let pos of arr) {
			const x = pos.x;
			const y = pos.y;
			const color = pos.color;

			let puyo = {
				gX: x * PUYO_SIZE,
				gY: y * PUYO_SIZE,
			};
			if (this.popFrame < frame * 1) {
				puyo.type = POP_SPRITE[color][0];
				puyo.state = POP_SPRITE[color][1];
			} else if (this.popFrame < frame * 2) {
				puyo.type = POP_SPRITE[color][0];
				puyo.state = POP_SPRITE[color][1] + 1;
				if (color == PUYO_TYPE.TRASH) {
					puyo.type = 13;
					puyo.state = 3;
				}
			} else if (this.popFrame < frame * 3) {
				puyo.type = 10;
				puyo.state = 6 + color * 2;
				if (color == PUYO_TYPE.TRASH) {
					puyo.type = POP_SPRITE[color][0];
					puyo.state = POP_SPRITE[color][1];
				}
			} else if (this.popFrame < frame * 4) {
				puyo.type = 10;
				puyo.state = 6 + color * 2 + 1;
				if (color == PUYO_TYPE.TRASH) {
					puyo.type = 13;
					puyo.state = 3;
				}
			}

			this.drawPuyo(puyo, CTX_NUM.PIECE);
		}

		return this.popFrame > frame * 5;
	};

	drawPuyo = (puyo, on) => {
		let type = puyo.type;
		let state = puyo.state;
		if (type == PUYO_TYPE.EMPTY) return;
		if (type == PUYO_TYPE.TRASH) {
			state = 6;
			type = 12;
		}
		
		let ctx = on==CTX_NUM.BOARD?this.boardCtx:this.pieceCtx;
		
		ctx.drawImage(
			SPRITE_IMAGE, //Source
			state * PUYO_SIZE, //sX
			type * PUYO_SIZE, //sY
			PUYO_SIZE, //s Width
			PUYO_SIZE, //s Height
			puyo.gX + X_OFFSET + this.offset, //dX
			puyo.gY - PUYO_SIZE + Y_OFFSET, //dY
			PUYO_SIZE, //dW
			PUYO_SIZE //dH
		);
		
		if(!this.preview) {
			socket.emit('graphics',{
				name:'drawPuyo',
				args:[puyo,on]
			})			
		}
	};

	drawNexts = () => {};

	drawPuyoByPointer = (x, y, state, color, board, on) => {
		let type = color;

		if (type == PUYO_TYPE.EMPTY) return;
		if (type == PUYO_TYPE.TRASH) {
			state = 6;
			type = 12;
		}

		let ctx = on==CTX_NUM.BOARD?this.boardCtx:this.pieceCtx;
		
		ctx.drawImage(
			SPRITE_IMAGE, //Source
			state * PUYO_SIZE, //sX
			type * PUYO_SIZE, //sY
			PUYO_SIZE, //s Width
			PUYO_SIZE, //s Height
			x, //dX
			y, //dY
			PUYO_SIZE, //dW
			PUYO_SIZE //dH
		);
		
		if(!this.preview){
			socket.emit('graphics',{
				name:'drawPuyoByPointer',
				args:[x,y,state,color,board,on]
			})			
		}
	};
}

const CTX_NUM = {
	BOARD : 0,
	PIECE : 1
};