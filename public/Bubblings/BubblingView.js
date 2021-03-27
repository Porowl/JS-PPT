import view from '../view.js';
import {socket} from '../main.js';

import {
	X_OFFSET,
	Y_OFFSET,
	BUBBLING_BOARD_WIDTH,
	BUBBLING_BOARD_HEIGHT,
	BUBBLING_VISIBLE_HEIGHT,
	SPRITE_IMAGE,
	BUBBLING_TYPE,
	BUBBLING_SIZE,
	POP_SPRITE,
	PLAYER_OFFSET,
	COLOR_WHITE,
	COLOR_GREY,
	BUBBLING_STATE,
	DX_DY,
	NEXT_Y_OFFSET,
	NEXT_X_OFFSET,
	P1_COLORS,
	P2_COLORS,
	
} from '../constants.js';

export default class BubblingView extends view {
	constructor(player) {
		super();
		this.player = player;
		this.offset = PLAYER_OFFSET * this.player;
		this.bubblingArr = [];
		this.popFrame = 0;
		this.initGraphics();
		this.preview = false;
	}
	/**
	 * 무대를 그립니다.
	 */
	initGraphics = () => {
		this.refreshPiece();
		let ctx = this.boardCtx;
		ctx.font = "16px Kongtext";
		ctx.fillStyle = COLOR_WHITE;
		ctx.textBaseline = 'top';
		ctx.textAlign = 'center';

		// BOARD
		this.callDrawOutline(
			X_OFFSET,
			Y_OFFSET,
			X_OFFSET + BUBBLING_BOARD_WIDTH * BUBBLING_SIZE,
			Y_OFFSET + BUBBLING_VISIBLE_HEIGHT * BUBBLING_SIZE
		);
		
		// NEXT
		this.callNextOutline();
		
		ctx = this.infoCtx;
		ctx.font = "16px Kongtext";
		ctx.fillStyle = COLOR_WHITE;
		ctx.textBaseline = 'top';
		ctx.textAlign = 'center';
		
		ctx.fillText('WAITING',
					X_OFFSET+this.offset+BUBBLING_BOARD_WIDTH*BUBBLING_SIZE/2,
					 Y_OFFSET+(BUBBLING_VISIBLE_HEIGHT-1)*BUBBLING_SIZE/2)
		ctx.fillText('FOR',
					X_OFFSET+this.offset+BUBBLING_BOARD_WIDTH*BUBBLING_SIZE/2,
					 Y_OFFSET+BUBBLING_VISIBLE_HEIGHT*BUBBLING_SIZE/2)
		ctx.fillText('OPPONENT',
					X_OFFSET+this.offset+BUBBLING_BOARD_WIDTH*BUBBLING_SIZE/2,
					 Y_OFFSET+(BUBBLING_VISIBLE_HEIGHT+1)*BUBBLING_SIZE/2)
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
		let ML = NEXT_X_OFFSET + BUBBLING_SIZE / 2 * 3 - rad + this.offset;
		let MR = NEXT_X_OFFSET + BUBBLING_SIZE * 2 + rad + this.offset;
		let R = NEXT_X_OFFSET + BUBBLING_SIZE / 2 * 5 + rad + this.offset;
		let U = NEXT_Y_OFFSET - rad;
		let MU = NEXT_Y_OFFSET + BUBBLING_SIZE / 2 * 5 - rad;
		let MD = NEXT_Y_OFFSET + BUBBLING_SIZE * 3 + rad; 
		let D = NEXT_Y_OFFSET + BUBBLING_SIZE / 2 * 9 + rad;
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


	addBubbling = bubbling => {
		this.bubblingArr.push(bubbling);
	};

	fallingBubblings = arr => {
		this.bubblingArr = arr;
	};

	addMultBubbling = multBubbling => {
		this.bubblingArr = multBubbling;
	};

	emptyArray = () => (this.bubblingArr.length = 0);

	getBubblingArr = () => this.bubblingArr;

	drawBoard = board => {
		this.boardCtx.clearRect(X_OFFSET+this.offset+1, Y_OFFSET+1, BUBBLING_BOARD_WIDTH * BUBBLING_SIZE, BUBBLING_VISIBLE_HEIGHT * BUBBLING_SIZE);

		for (var i = 0; i < BUBBLING_BOARD_WIDTH; i++) {
			for (var j = 1; j < BUBBLING_BOARD_HEIGHT; j++) {
				let x = X_OFFSET + i * BUBBLING_SIZE + 1 + this.offset;
				let y = Y_OFFSET + (j - 1) * BUBBLING_SIZE + 1;

				let color = board.table[j][i];
				if (color != BUBBLING_TYPE.EMPTY) {
					let color = board.table[j][i];
					let state = this.getState(board.table,i,j);
					this.drawBubblingByPointer(x, y, state, color, CTX_NUM.BOARD);
				}
				this.boardCtx.lineWidth = 1;
				this.boardCtx.strokeStyle = "rgb(0,0,0)"
				this.boardCtx.strokeRect(x, y, BUBBLING_SIZE, BUBBLING_SIZE);
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

		let main = this.bubblingArr.mainPiece;
		let sub = this.bubblingArr.subPiece;

		main.move();
		sub.moveRotate(main.gX, main.gY);

		this.drawBubbling(main, CTX_NUM.PIECE);
		this.drawBubbling(sub, CTX_NUM.PIECE);
	};

	fallCycle = () => {
		let counter = 0;
		this.refreshPiece();
		for (let x = 0; x < BUBBLING_BOARD_WIDTH; x++) {
			for (let bubbling of this.bubblingArr[x]) {
				if (bubbling) {
					if (!bubbling.fall()) counter++;
					this.drawBubbling(bubbling, CTX_NUM.PIECE);
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

			let bubbling = {
				gX: x * BUBBLING_SIZE,
				gY: y * BUBBLING_SIZE,
			};
			if (this.popFrame < frame * 1) {
				bubbling.type = POP_SPRITE[color][0];
				bubbling.state = POP_SPRITE[color][1];
			} else if (this.popFrame < frame * 2) {
				bubbling.type = POP_SPRITE[color][0];
				bubbling.state = POP_SPRITE[color][1] + 1;
				if (color == BUBBLING_TYPE.TRASH) {
					bubbling.type = 13;
					bubbling.state = 3;
				}
			} else if (this.popFrame < frame * 3) {
				bubbling.type = 10;
				bubbling.state = 6 + color * 2;
				if (color == BUBBLING_TYPE.TRASH) {
					bubbling.type = POP_SPRITE[color][0];
					bubbling.state = POP_SPRITE[color][1];
				}
			} else if (this.popFrame < frame * 4) {
				bubbling.type = 10;
				bubbling.state = 6 + color * 2 + 1;
				if (color == BUBBLING_TYPE.TRASH) {
					bubbling.type = 13;
					bubbling.state = 3;
				}
			}

			this.drawBubbling(bubbling, CTX_NUM.PIECE);
		}

		return this.popFrame > frame * 5;
	};

	drawBubbling = (bubbling, on) => {
		let type = bubbling.type;
		let state = bubbling.state;
		if (type == BUBBLING_TYPE.EMPTY) return;
		if (type == BUBBLING_TYPE.TRASH) {
			state = 6;
			type = 12;
		}
		
		let ctx = (on==CTX_NUM.BOARD?this.boardCtx:this.pieceCtx);
		
		ctx.drawImage(
			SPRITE_IMAGE, //Source
			state * BUBBLING_SIZE, //sX
			type * BUBBLING_SIZE, //sY
			BUBBLING_SIZE, //s Width
			BUBBLING_SIZE, //s Height
			bubbling.gX + X_OFFSET + this.offset, //dX
			bubbling.gY - BUBBLING_SIZE + Y_OFFSET, //dY
			BUBBLING_SIZE, //dW
			BUBBLING_SIZE //dH
		);
		
		if(!this.preview) {
			socket.emit('graphics',{
				name:'drawBubbling',
				args:[bubbling,on]
			})			
		}
	};

	refreshPiece = () => {
		this.pieceCtx.clearRect(X_OFFSET+this.offset-BUBBLING_SIZE, 0, (BUBBLING_BOARD_WIDTH+2) * BUBBLING_SIZE, Y_OFFSET + 1 + BUBBLING_VISIBLE_HEIGHT * BUBBLING_SIZE);
		if(!this.preview) {
			socket.emit('graphics',{
				name:'refreshPiece',
				args:null
			})			
		}
	}

	drawBubblingByPointer = (x, y, state, color, on) => {
		let type = color;

		if (type == BUBBLING_TYPE.EMPTY) return;
		if (type == BUBBLING_TYPE.TRASH) {
			state = 6;
			type = 12;
		}

		let ctx = (on==CTX_NUM.BOARD?this.boardCtx:this.pieceCtx);
		
		ctx.drawImage(
			SPRITE_IMAGE, //Source
			state * BUBBLING_SIZE, //sX
			type * BUBBLING_SIZE, //sY
			BUBBLING_SIZE, //s Width
			BUBBLING_SIZE, //s Height
			x, //dX
			y, //dY
			BUBBLING_SIZE, //dW
			BUBBLING_SIZE //dH
		);
	};

	getState = (table, x, y) => {
		if (x < 0 || x >= BUBBLING_BOARD_WIDTH || y >= BUBBLING_BOARD_HEIGHT || y < 0) return BUBBLING_STATE.N;

		let order = 'UDLR';
		let temp = '';
		let color = table[y][x];

		for (let i = 0; i < 4; i++) {
			let nx = x + DX_DY[i][0];
			let ny = y + DX_DY[i][1];

			if (nx >= 0 && nx < BUBBLING_BOARD_WIDTH && ny < BUBBLING_BOARD_HEIGHT && ny >= 0) {
				if (table[ny][nx] == color) temp += order.charAt(i);	
			}
		}

		if (temp.length == 0) temp = 'N';

		return BUBBLING_STATE[temp];
	};

	drawNexts = (n, m) =>{
        const p1 = ( n & 0xc ) / 0x4;
        const p2 = n % 0x4;
        const p3 = ( m & 0xc ) / 0x4;
        const p4 = m % 0x4;
		let ctx = this.boardCtx;
		ctx.clearRect(NEXT_X_OFFSET+BUBBLING_SIZE/2 + this.offset,NEXT_Y_OFFSET+BUBBLING_SIZE/2,BUBBLING_SIZE,BUBBLING_SIZE*2);
		ctx.clearRect(NEXT_X_OFFSET+BUBBLING_SIZE/2*3 + this.offset,NEXT_Y_OFFSET+BUBBLING_SIZE/2*5,BUBBLING_SIZE,BUBBLING_SIZE*2);
		ctx.drawImage(SPRITE_IMAGE, 0, p2 * BUBBLING_SIZE, BUBBLING_SIZE, BUBBLING_SIZE, NEXT_X_OFFSET+BUBBLING_SIZE/2 + this.offset, NEXT_Y_OFFSET + BUBBLING_SIZE/2, BUBBLING_SIZE, BUBBLING_SIZE);
		ctx.drawImage(SPRITE_IMAGE, 0, p1 * BUBBLING_SIZE, BUBBLING_SIZE, BUBBLING_SIZE, NEXT_X_OFFSET+BUBBLING_SIZE/2 + this.offset, NEXT_Y_OFFSET + BUBBLING_SIZE*3/2, BUBBLING_SIZE, BUBBLING_SIZE);
		ctx.drawImage(SPRITE_IMAGE, 0, p4 * BUBBLING_SIZE, BUBBLING_SIZE, BUBBLING_SIZE, NEXT_X_OFFSET+BUBBLING_SIZE/2*3 + this.offset, NEXT_Y_OFFSET + BUBBLING_SIZE / 2 * 5, BUBBLING_SIZE, BUBBLING_SIZE);
		ctx.drawImage(SPRITE_IMAGE, 0, p3 * BUBBLING_SIZE, BUBBLING_SIZE, BUBBLING_SIZE, NEXT_X_OFFSET+BUBBLING_SIZE/2*3 + this.offset, NEXT_Y_OFFSET + BUBBLING_SIZE / 2 * 7, BUBBLING_SIZE, BUBBLING_SIZE);
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