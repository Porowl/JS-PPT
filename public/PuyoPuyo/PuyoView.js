import view from '../view.js';

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
	PLAYER_OFFSET
} from '../constants.js';

export default class PuyoView extends view {
	constructor(player) {
		super();
		this.player = player;
		this.offset = PLAYER_OFFSET*this.player;
		this.puyoArr = [];
		this.popFrame = 0;
		this.initGraphics();
	}

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
					this.drawPuyoByPointer(x, y, state, color, board, this.boardCtx);
				}
				this.boardCtx.lineWidth = 1;
				this.boardCtx.strokeStyle = "rgb(0,0,0)"
				this.boardCtx.strokeRect(x, y, PUYO_SIZE, PUYO_SIZE);
			}
		}
	};

	moveCycle = () => {
		this.pieceCtx.clearRect(X_OFFSET+this.offset+1, 0+1, PUYO_BOARD_WIDTH * PUYO_SIZE, PUYO_VISIBLE_HEIGHT * PUYO_SIZE);

		let main = this.puyoArr.mainPiece;
		let sub = this.puyoArr.subPiece;

		main.move();
		sub.moveRotate(main.gX, main.gY);

		this.drawPuyo(main, this.pieceCtx);
		this.drawPuyo(sub, this.pieceCtx);
	};

	fallCycle = () => {
		let counter = 0;
		this.pieceCtx.clearRect(X_OFFSET+this.offset+1, Y_OFFSET+1, PUYO_BOARD_WIDTH * PUYO_SIZE, PUYO_VISIBLE_HEIGHT * PUYO_SIZE);
		for (let x = 0; x < PUYO_BOARD_WIDTH; x++) {
			for (let puyo of this.puyoArr[x]) {
				if (puyo) {
					if (!puyo.fall()) counter++;
					this.drawPuyo(puyo, this.pieceCtx);
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

			this.drawPuyo(puyo, this.pieceCtx);
		}

		return this.popFrame > frame * 5;
	};

	drawPuyo = (puyo, ctx) => {
		let type = puyo.type;
		let state = puyo.state;
		if (type == PUYO_TYPE.EMPTY) return;
		if (type == PUYO_TYPE.TRASH) {
			state = 6;
			type = 12;
		}
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
	};

	drawNexts = () => {};

	drawPuyoByPointer = (x, y, state, color, board, ctx) => {
		let type = color;

		if (type == PUYO_TYPE.EMPTY) return;
		if (type == PUYO_TYPE.TRASH) {
			state = 6;
			type = 12;
		}

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
	};
}