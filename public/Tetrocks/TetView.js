import {ctx0, ctx1, ctx2, ctx3, NEXT,HOLD, PLAYER_OFFSET, NEXT_X_OFFSET, NEXT_Y_OFFSET, NEXT_BLOCK_SIZE_OUTLINE, NEXT_BLOCK_SIZE, HOLD_X_OFFSET, HOLD_Y_OFFSET, HOLD_BLOCK_SIZE_OUTLINE, HOLD_BLOCK_SIZE, Y_OFFSET, X_OFFSET, DIST_BTW_NEXTS, BLOCK_SIZE_OUTLINE, BLOCK_SIZE, COLOR_WHITE, COLOR_GREY, COLOR_BLACK, COLOR_GHOST, P1_COLORS, P2_COLORS, COLOR_MAP, GHOST_COLOR_MAP, LINE_CLEAR_WHITE, LINE_CLEAR_BLACK, PIECE_3D_ADD,LOCK_WHITE,DRAWMODE,PIECE_MAP,GAUGE_X_OFFSET,GAUGE_Y_OFFSET,BOARD_HEIGHT,BOARD_WIDTH,VISIBLE_HEIGHT,BOARD_CENTER_X,BOARD_CENTER_Y,BOARD_END_Y,LINE_CLEAR_FRAMES,LOCK_ANIMATION_FRAMES,HARDDROP_ANIMATION_FRAMES } from "../constants.js";

import view from '../view.js';
import {socket} from '../main.js';

export default class TetView extends view {
	constructor(player) {
		super(player);
		this.initGraphics();
		this.refreshHold();
		this.refreshNexts();
	}
	/**
	 * 무대를 그립니다.
	 */
	initGraphics = () => {
		let ctx = this.boardCtx;
		ctx.font = "16px Kongtext";
		ctx.fillStyle = COLOR_WHITE;
		ctx.textBaseline = 'top';
		ctx.textAlign = 'center';
		//ctx.fillText(
		//	LEVEL,
		//	HOLD_X_OFFSET + HOLD_BLOCK_SIZE_OUTLINE * 3 + this.offset,
		//	Y_OFFSET + (VISIBLE_HEIGHT - 6) * BLOCK_SIZE_OUTLINE + 5
		//);

		// BOARD
		this.callDrawOutline(
			X_OFFSET,
			Y_OFFSET,
			X_OFFSET + BOARD_WIDTH * BLOCK_SIZE_OUTLINE,
			Y_OFFSET + VISIBLE_HEIGHT * BLOCK_SIZE_OUTLINE
		);

		ctx.fillText(
			NEXT,
			NEXT_X_OFFSET + NEXT_BLOCK_SIZE_OUTLINE * 3 + this.offset,
			NEXT_Y_OFFSET + 5
		);
		ctx.fillText(
			HOLD,
			HOLD_X_OFFSET + HOLD_BLOCK_SIZE_OUTLINE * 3 + this.offset,
			HOLD_Y_OFFSET + 5
		);
		// NEXTS
		this.callDrawOutline(
			NEXT_X_OFFSET,
			NEXT_Y_OFFSET,
			NEXT_X_OFFSET + NEXT_BLOCK_SIZE_OUTLINE * 6,
			NEXT_Y_OFFSET + DIST_BTW_NEXTS * 6 + NEXT_BLOCK_SIZE_OUTLINE + 30
		);

		// HOLD
		this.callDrawOutline(
			HOLD_X_OFFSET,
			HOLD_Y_OFFSET,
			HOLD_X_OFFSET + HOLD_BLOCK_SIZE_OUTLINE * 6,
			HOLD_Y_OFFSET + HOLD_BLOCK_SIZE_OUTLINE * 7
		);

		/*		// LEVEL
		 *		this.callDrawOutline(
		 *			HOLD_X_OFFSET,
		 *			Y_OFFSET + (VISIBLE_HEIGHT - 6) * BLOCK_SIZE_OUTLINE,
		 *			HOLD_X_OFFSET + HOLD_BLOCK_SIZE_OUTLINE * 6,
		 *			Y_OFFSET + VISIBLE_HEIGHT * BLOCK_SIZE_OUTLINE
		 *		);*/
		
		ctx = this.infoCtx;
		ctx.font = "16px Kongtext";
		ctx.fillStyle = COLOR_WHITE;
		ctx.textBaseline = 'top';
		ctx.textAlign = 'center';
		
		ctx.fillText('WAITING',
					X_OFFSET+this.offset+BOARD_WIDTH*BLOCK_SIZE_OUTLINE/2,
					 Y_OFFSET+(VISIBLE_HEIGHT-2)*BLOCK_SIZE_OUTLINE/2)
		ctx.fillText('FOR',
					X_OFFSET+this.offset+BOARD_WIDTH*BLOCK_SIZE_OUTLINE/2,
					 Y_OFFSET+VISIBLE_HEIGHT*BLOCK_SIZE_OUTLINE/2)
		ctx.fillText('OPPONENT',
					X_OFFSET+this.offset+BOARD_WIDTH*BLOCK_SIZE_OUTLINE/2,
					 Y_OFFSET+(VISIBLE_HEIGHT+2)*BLOCK_SIZE_OUTLINE/2)
	};
	/* BOARD & PIECE GRAPHICS */

	draw = (table) => {
		this.clearPiece();
		
		let ctx = this.boardCtx;

		for (let i = 0; i < VISIBLE_HEIGHT; i++)
			for (let j = 0; j < BOARD_WIDTH; j++) {
				let x = X_OFFSET + j * BLOCK_SIZE_OUTLINE + 1 + this.offset;
				let y = Y_OFFSET + i * BLOCK_SIZE_OUTLINE + 1;
				let color = table[i + 20][j];
				ctx.fillStyle = color ==-1 ? COLOR_BLACK : COLOR_MAP[color];
				ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
				
				if (table[i + 20][j] != -1) {
					ctx.fillStyle = PIECE_3D_ADD;
					const offset = 3;
					ctx.fillRect(
						x + offset,
						y + offset,
						BLOCK_SIZE - offset * 2,
						BLOCK_SIZE - offset * 2
					);
				}
			}
		if(!this.preview) {
			socket.emit('graphics',{
				name:'draw',
				args:[table]
			})
		}
		
	};

	clearPiece = () => {
		let ctx = this.pieceCtx;
		ctx.clearRect(X_OFFSET+this.offset+1,
					  Y_OFFSET+1,
					  BOARD_WIDTH * BLOCK_SIZE_OUTLINE,
					  VISIBLE_HEIGHT * BLOCK_SIZE_OUTLINE
					 );
		if(!this.preview) {
			socket.emit('graphics',{
				name:'clearPiece',
				args:null
			})
		}
	}
	
	drawPiece = (piece, MODE, index = 0) => {
		let ghost = false;
		let piece3d = true;
		let ctx = this.pieceCtx;

		let color;
		switch (MODE) {
			case DRAWMODE.DRAWPIECE:
				color = COLOR_MAP[piece.typeId];
				piece3d = true;
				break;
			case DRAWMODE.DRAWGHOST:
				color = GHOST_COLOR_MAP[piece.typeId];
				ghost = true;
				break;
		}

		for (let i = 0; i < 4; i++)
			for (let j = 0; j < 4; j++)
				if (PIECE_MAP[piece.typeId][piece.rotation] & (0x8000 >> (i * 4 + j))) {
					ctx.fillStyle = color;
					let x = X_OFFSET + (piece.x + j) * BLOCK_SIZE_OUTLINE + 1 + this.offset;
					let y = Y_OFFSET + (piece.y + i + index - (BOARD_HEIGHT-VISIBLE_HEIGHT)) * BLOCK_SIZE_OUTLINE + 1;
					let w = BLOCK_SIZE;
					let h = BLOCK_SIZE;
					if (y > Y_OFFSET) {
						ctx.fillRect(x, y, w, h);
						if (ghost) {
							ctx.fillStyle = COLOR_BLACK;
							const offset = 2;
							ctx.fillRect(x + offset, y + offset, w - offset * 2, h - offset * 2);
						}
						if (piece3d) {
							ctx.fillStyle = PIECE_3D_ADD;
							const offset = 3;
							ctx.fillRect(x + offset, y + offset, w - offset * 2, h - offset * 2);
						}
					}
				}
		
		if(!this.preview) {
			socket.emit('graphics',{
				name:'drawPiece',
				args:[piece, MODE, index]
			})
		}
	};

	drawNext = (typeId, index) => {
		if(index==0)this.refreshNexts();
		for (let i = 0; i < 4; i++)
			for (let j = 0; j < 4; j++)
				if (PIECE_MAP[typeId][0] & (0x8000 >> (i * 4 + j))) {
					this.boardCtx.fillStyle = COLOR_MAP[typeId];
					var x = NEXT_X_OFFSET + (j + 1) * NEXT_BLOCK_SIZE_OUTLINE + this.offset;
					var y =
						NEXT_Y_OFFSET +
						(i + 1) * NEXT_BLOCK_SIZE_OUTLINE +
						DIST_BTW_NEXTS * index +
						30;
					var w = NEXT_BLOCK_SIZE;
					var h = NEXT_BLOCK_SIZE;
					this.boardCtx.fillRect(x, y, w, h);
				}
		if(!this.preview) {
			socket.emit('graphics',{
				name:'drawNext',
				args:[typeId,index]
			})
		}
	};

	refreshNexts = () => {
		const ctx = this.boardCtx;
		ctx.fillStyle = COLOR_BLACK;
		ctx.fillRect(
			NEXT_X_OFFSET + this.offset, // x
			Y_OFFSET + 30, // y
			NEXT_BLOCK_SIZE_OUTLINE * 6, // w
			DIST_BTW_NEXTS * 6 + NEXT_BLOCK_SIZE_OUTLINE // h
		);
	};

	drawHold = (typeId = -1, mode) => {
		if (typeId == -1) return;
		let color;
		let ctx = this.boardCtx;
		switch (mode) {
			case DRAWMODE.DRAWPIECE:
				color = COLOR_MAP[typeId];
				break;
			case DRAWMODE.DRAWGHOST:
				color = COLOR_GHOST;
				break;
		}

		this.refreshHold();
		ctx.fillStyle = color;
		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 4; j++) {
				if (PIECE_MAP[typeId][0] & (0x8000 >> (i * 4 + j))) {
					var x = HOLD_X_OFFSET + (j + 1) * HOLD_BLOCK_SIZE_OUTLINE + this.offset;
					var y = HOLD_Y_OFFSET + (i + 1) * HOLD_BLOCK_SIZE_OUTLINE + 30;
					var w = HOLD_BLOCK_SIZE;
					var h = HOLD_BLOCK_SIZE;
					ctx.fillRect(x, y, w, h);
				}
			}
		}
		
		if(!this.preview) {
			socket.emit('graphics',{
				name:'drawHold',
				args:[typeId,mode]
			})
		}
	};

	refreshHold = () => {
		const ctx = this.boardCtx;
		ctx.fillStyle = COLOR_BLACK;
		ctx.fillRect(
			HOLD_X_OFFSET + this.offset, // x
			HOLD_Y_OFFSET + 30, // y
			HOLD_BLOCK_SIZE_OUTLINE * 6, // w
			HOLD_BLOCK_SIZE_OUTLINE * 5 // h
		);
	};

	clearAnimation = (l, i) => {
		let ctx = this.aniCtx;
		var x = X_OFFSET + 1 + this.offset;
		var y = Y_OFFSET + (l - 20) * BLOCK_SIZE_OUTLINE + 1;
		var w = BLOCK_SIZE_OUTLINE * BOARD_WIDTH;
		var h = BLOCK_SIZE;
		
		ctx.fillStyle = (i>LINE_CLEAR_FRAMES?LINE_CLEAR_WHITE:LINE_CLEAR_BLACK)

		ctx.fillRect(x, y, w, h);
		if(i==0) ctx.clearRect(x,y,w,h);
		
		if(!this.preview) {
			socket.emit('graphics',{
				name:'clearAnimation',
				args:[l,i]
			})
		}
	};

	/* UI GRAPHICS*/

	levelProgress = (lines, level, goal) => {
		let x = HOLD_X_OFFSET + HOLD_BLOCK_SIZE_OUTLINE * 3 + this.offset;
		let y = Y_OFFSET + (VISIBLE_HEIGHT - 3) * BLOCK_SIZE_OUTLINE;

		let ctx = this.infoCtx;

		ctx.clearRect(
			HOLD_X_OFFSET + this.offset,
			Y_OFFSET + (VISIBLE_HEIGHT - 4) * BLOCK_SIZE_OUTLINE,
			HOLD_X_OFFSET + HOLD_BLOCK_SIZE_OUTLINE * 6,
			Y_OFFSET + VISIBLE_HEIGHT * BLOCK_SIZE_OUTLINE
		);

		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.fillStyle = COLOR_WHITE;
		ctx.font = "24px Kongtext";
		ctx.fillText(level + 1, x, y);
		ctx.font = "12px Kongtext";
		ctx.fillText(`${lines}/${goal}`, x, y + BLOCK_SIZE_OUTLINE * 2.25);

		ctx.lineWidth = 5;

		ctx.beginPath();
		ctx.arc(x, y, 30, 0, 2 * Math.PI, false);
		ctx.strokeStyle = COLOR_GHOST;
		ctx.stroke();
		ctx.closePath();
		ctx.beginPath();

		let start = (3 / 4) * 2 * Math.PI;
		let end = lines / goal;
		end = start + 2 * Math.PI * end;
		ctx.arc(x, y, 30, start, end, false);
		ctx.strokeStyle = COLOR_MAP[(level + 1) % 7];
		ctx.stroke();
		ctx.closePath();
	};

	lockAnimation = (piece, frame = 0, offset = 0) => {
		let ctx = this.aniCtx;
		for (let i = 0; i < 4; i++)
			for (let j = 0; j < 4; j++)
				if (PIECE_MAP[piece.typeId][piece.rotation] & (0x8000 >> (i * 4 + j))) {
					ctx.fillStyle = LOCK_WHITE;
					let x = X_OFFSET + (piece.x + j) * BLOCK_SIZE_OUTLINE + 1 + this.offset;
					let y = Y_OFFSET + (piece.y + i - offset - 20) * BLOCK_SIZE_OUTLINE + 1;
					let w = BLOCK_SIZE;
					let h = BLOCK_SIZE;
					if (y > Y_OFFSET) {
						ctx.clearRect(x, y, w, h);
						for (let f = 0; f < Math.min(LOCK_ANIMATION_FRAMES - frame, frame); f++) {
							ctx.fillRect(x, y, w, h);
						}
					}
				}
		if (frame == LOCK_ANIMATION_FRAMES) return;
		setTimeout(() => this.lockAnimation(piece, frame + 1, offset), 1000 / 60);
	};

	hardDropAnimation = (tarPiece, offset = 0) => {
		let ctx = this.aniCtx;
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				if (PIECE_MAP[tarPiece.typeId][tarPiece.rotation] & (0x8000 >> (i * 4 + j))) {
					ctx.strokeStyle = GHOST_COLOR_MAP[tarPiece.typeId];
					ctx.lineWidth = 1;
					for (let z = 0; z < BLOCK_SIZE; z++) {
						let x = X_OFFSET + (tarPiece.x + j) * BLOCK_SIZE_OUTLINE + 1 + z + this.offset;
						let y = Y_OFFSET + (tarPiece.y + i - offset-20) * BLOCK_SIZE_OUTLINE;
						let height = parseInt(Math.random() * (y - Y_OFFSET));
						ctx.beginPath();
						ctx.moveTo(x, y);
						ctx.lineTo(x, y - height);
						ctx.stroke();
						ctx.closePath();
					}
				}
			}
		}
		setTimeout(
			() =>
				ctx.clearRect(
					X_OFFSET + this.offset,
					Y_OFFSET,
					BOARD_WIDTH * BLOCK_SIZE_OUTLINE,
					VISIBLE_HEIGHT * BLOCK_SIZE_OUTLINE
				),
			(HARDDROP_ANIMATION_FRAMES+1) * 1000 / 60
		);
	};

	displayGauge = n =>{
		let level = n / 20 | 0;
		let height = n % 20;
		let ctx = this.boardCtx;
		
		ctx.fillStyle = colorArr[level];
		ctx.fillRect(GAUGE_X_OFFSET + this.offset,GAUGE_Y_OFFSET,NEXT_BLOCK_SIZE_OUTLINE,NEXT_BLOCK_SIZE_OUTLINE*20);
		
		ctx.fillStyle = colorArr[level+1]
		ctx.fillRect(GAUGE_X_OFFSET + this.offset,GAUGE_Y_OFFSET + NEXT_BLOCK_SIZE_OUTLINE * (20-height),NEXT_BLOCK_SIZE_OUTLINE,NEXT_BLOCK_SIZE_OUTLINE * height);
		
		ctx.strokeStyle = COLOR_BLACK;
		ctx.lineWidth = 1;
		for(let i = 0; i<20; i++) {
		ctx.strokeRect(GAUGE_X_OFFSET + this.offset,GAUGE_Y_OFFSET+i*NEXT_BLOCK_SIZE_OUTLINE,NEXT_BLOCK_SIZE_OUTLINE,NEXT_BLOCK_SIZE_OUTLINE)
		}
		this.callDrawOutline(
			GAUGE_X_OFFSET, GAUGE_Y_OFFSET, GAUGE_X_OFFSET + NEXT_BLOCK_SIZE_OUTLINE, GAUGE_Y_OFFSET + NEXT_BLOCK_SIZE_OUTLINE * 20 );	
		if(!this.preview) {
			socket.emit('graphics',{
				name:'displayGauge',
				args:n
			})
		}
	}
}

const colorArr = [COLOR_GREY, COLOR_MAP[0], COLOR_MAP[6], COLOR_MAP[1]]