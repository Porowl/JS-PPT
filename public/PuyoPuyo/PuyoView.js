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
	PUYO_STATE,
	DX_DY,
	NEXT_Y_OFFSET,
	NEXT_X_OFFSET,
	P1_COLORS,
	P2_COLORS,
	
} from '../constants.js';

export default class PuyoView extends view {
	constructor(player) {
		super();
		this.player = player;
		this.offset = PLAYER_OFFSET * this.player;
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
		
		// NEXT
		this.callNextOutline();
		
		ctx = this.infoCtx;
		ctx.font = "16px 'Press Start 2P'";
		ctx.fillStyle = COLOR_WHITE;
		ctx.textBaseline = 'top';
		ctx.textAlign = 'center';
		
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


	callNextOutline = () => {
		let color = this.player == 0 ? P1_COLORS : P2_COLORS;
		let rads = [5,2,10];
		let sizes = [7,4,5];
		let colors = [1,0,0];
		
		let max = 0;
		let size = 0;
		
		for(let i = 0; i<rads.length;i++)
		{
			this.drawNextOutline(rads[i],sizes[i],color[colors[i]]);
		}
	};

	drawNextOutline = (rad, size, color) =>{
		let ctx = this.boardCtx;
		
		let L = NEXT_X_OFFSET - rad + this.offset;
		let ML = NEXT_X_OFFSET + PUYO_SIZE / 2 * 3 - rad + this.offset;
		let MR = NEXT_X_OFFSET + PUYO_SIZE * 2 + rad + this.offset;
		let R = NEXT_X_OFFSET + PUYO_SIZE / 2 * 5 + rad + this.offset;
		let U = NEXT_Y_OFFSET - rad;
		let MU = NEXT_Y_OFFSET + PUYO_SIZE / 2 * 5 - rad;
		let MD = NEXT_Y_OFFSET + PUYO_SIZE * 3 + rad; 
		let D = NEXT_Y_OFFSET + PUYO_SIZE / 2 * 9 + rad;
		ctx.strokeStyle = color;
		ctx.beginPath();
		
		ctx.moveTo(L,U);
		ctx.lineTo(MR,U);
		ctx.lineTo(MR,MU);
		ctx.lineTo(R,MU);
		ctx.lineTo(R,D);
		ctx.lineTo(ML,D);
		ctx.lineTo(ML,MD);
		ctx.lineTo(L,MD);
		
		ctx.lineWidth = size;
		ctx.closePath();
		ctx.stroke();
	}


	addPuyo = puyo => {
		this.puyoArr.push(puyo);
	};

	fallingPuyos = arr => {
		this.puyoArr = arr;
	};

	addMultPuyo = multPuyo => {
		this.puyoArr = multPuyo;
	};

	emptyArray = () => (this.puyoArr.length = 0);

	getPuyoArr = () => this.puyoArr;

	drawBoard = board => {
		this.boardCtx.clearRect(X_OFFSET+this.offset+1, Y_OFFSET+1, PUYO_BOARD_WIDTH * PUYO_SIZE, PUYO_VISIBLE_HEIGHT * PUYO_SIZE);

		for (var i = 0; i < PUYO_BOARD_WIDTH; i++) {
			for (var j = 1; j < PUYO_BOARD_HEIGHT; j++) {
				let x = X_OFFSET + i * PUYO_SIZE + 1 + this.offset;
				let y = Y_OFFSET + (j - 1) * PUYO_SIZE + 1;

				let color = board.table[j][i];
				if (color != PUYO_TYPE.EMPTY) {
					let color = board.table[j][i];
					let state = this.getState(board.table,i,j);
					this.drawPuyoByPointer(x, y, state, color, CTX_NUM.BOARD);
				}
				this.boardCtx.lineWidth = 1;
				this.boardCtx.strokeStyle = "rgb(0,0,0)"
				this.boardCtx.strokeRect(x, y, PUYO_SIZE, PUYO_SIZE);
			}
		}
		if(!this.preview){
			socket.emit('graphics',{
				name:'drawBoard',
				args:[board]
			})			
		}
	};

	moveCycle = () => {
		this.refreshPiece();

		let main = this.puyoArr.mainPiece;
		let sub = this.puyoArr.subPiece;

		main.move();
		sub.moveRotate(main.gX, main.gY);

		this.drawPuyo(main, CTX_NUM.PIECE);
		this.drawPuyo(sub, CTX_NUM.PIECE);
	};

	fallCycle = () => {
		let counter = 0;
		this.refreshPiece();
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

	popCycle = arr => {
		if (arr.length == 0) return true;
		this.popFrame++;

		let frame = 6;
		this.refreshPiece();
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
		
		let ctx = (on==CTX_NUM.BOARD?this.boardCtx:this.pieceCtx);
		
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

	refreshPiece = () => {
		this.pieceCtx.clearRect(X_OFFSET+this.offset+1, 0, PUYO_BOARD_WIDTH * PUYO_SIZE, Y_OFFSET + 1 + PUYO_VISIBLE_HEIGHT * PUYO_SIZE);
		if(!this.preview) {
			socket.emit('graphics',{
				name:'refreshPiece',
				args:null
			})			
		}
	}

	drawNexts = () => {};

	drawPuyoByPointer = (x, y, state, color, on) => {
		let type = color;

		if (type == PUYO_TYPE.EMPTY) return;
		if (type == PUYO_TYPE.TRASH) {
			state = 6;
			type = 12;
		}

		let ctx = (on==CTX_NUM.BOARD?this.boardCtx:this.pieceCtx);
		
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

	getState = (table, x, y) => {
		if (x < 0 || x >= PUYO_BOARD_WIDTH || y >= PUYO_BOARD_HEIGHT || y < 0) return PUYO_STATE.N;

		let order = 'UDLR';
		let temp = '';
		let color = table[y][x];

		for (let i = 0; i < 4; i++) {
			let nx = x + DX_DY[i][0];
			let ny = y + DX_DY[i][1];

			if (nx >= 0 && nx < PUYO_BOARD_WIDTH && ny < PUYO_BOARD_HEIGHT && ny >= 0) {
				if (table[ny][nx] == color) temp += order.charAt(i);	
			}
		}

		if (temp.length == 0) temp = 'N';

		return PUYO_STATE[temp];
	};

	drawNexts = (n, m) =>{
        const p1 = ( n & 0o70 ) / 0o10;
        const p2 = n % 0o10;
        const p3 = ( m & 0o70 ) / 0o10;
        const p4 = m % 0o10;
		let ctx = this.boardCtx;
		ctx.drawImage(SPRITE_IMAGE, 0, p2 * PUYO_SIZE, PUYO_SIZE, PUYO_SIZE, NEXT_X_OFFSET+PUYO_SIZE/2 + this.offset, NEXT_Y_OFFSET + PUYO_SIZE/2, PUYO_SIZE, PUYO_SIZE);
		ctx.drawImage(SPRITE_IMAGE, 0, p1 * PUYO_SIZE, PUYO_SIZE, PUYO_SIZE, NEXT_X_OFFSET+PUYO_SIZE/2 + this.offset, NEXT_Y_OFFSET + PUYO_SIZE*3/2, PUYO_SIZE, PUYO_SIZE);
		ctx.drawImage(SPRITE_IMAGE, 0, p4 * PUYO_SIZE, PUYO_SIZE, PUYO_SIZE, NEXT_X_OFFSET+PUYO_SIZE/2*3 + this.offset, NEXT_Y_OFFSET + PUYO_SIZE / 2 * 5, PUYO_SIZE, PUYO_SIZE);
		ctx.drawImage(SPRITE_IMAGE, 0, p3 * PUYO_SIZE, PUYO_SIZE, PUYO_SIZE, NEXT_X_OFFSET+PUYO_SIZE/2*3 + this.offset, NEXT_Y_OFFSET + PUYO_SIZE / 2 * 7, PUYO_SIZE, PUYO_SIZE);
		if(!this.preview) {
			socket.emit('graphics',{
				name:'drawNexts',
				args: [n,m]
			})			
		}
	}
}

const CTX_NUM = {
	BOARD : 0,
	PIECE : 1
};