import {ctx0, ctx1, ctx2, ctx3} from "./constants.js";
import {socket} from "./main.js"

import {PLAYER_OFFSET, HOLD, HOLD_X_OFFSET, HOLD_Y_OFFSET, NEXT, NEXT_X_OFFSET, NEXT_Y_OFFSET, NEXT_BLOCK_SIZE_OUTLINE, COLOR_WHITE, HOLD_BLOCK_SIZE_OUTLINE, X_OFFSET, Y_OFFSET, BOARD_WIDTH, BLOCK_SIZE_OUTLINE, COLOR_BLACK, COLOR_MAP,VISIBLE_HEIGHT,P2_COLORS,P1_COLORS,DIST_BTW_NEXTS,BOARD_END_Y,COLOR_GREY,BOARD_CENTER_X,BOARD_CENTER_Y,GAME_STATE,NUISANCE_QUEUE,SPRITE_IMAGE,BUBBLING_SIZE} from './constants.js';

export default class view {
	constructor(player = 0) {
		this.player = player;
		this.boardCtx = ctx0;
		this.pieceCtx = ctx1;
		this.infoCtx = ctx2;
		this.aniCtx = ctx3;
		this.offset = PLAYER_OFFSET * player;
		this.clearLineInfo;
		this.preview = false;
	}

	callDrawOutline = (L, U, R, D) => {
		let color = this.player == 0 ? P1_COLORS : P2_COLORS;
		
		this.drawOutline(L + this.offset, U, R + this.offset, D, 5, 7, color[1]);
		this.drawOutline(L + this.offset, U, R + this.offset, D, 2, 4, color[0]);
		this.drawOutline(L + this.offset, U, R + this.offset, D, 10, 5, color[0]);
	};

	drawOutline = (L, U, R, D, rad, size, color) => {
		let ctx = this.boardCtx;
		ctx.strokeStyle = color;
		ctx.lineJoin = "round";
		ctx.beginPath();

		L -= rad;
		R += rad;
		U -= rad;
		D += rad;
		
		ctx.moveTo(L,U);
		ctx.lineTo(R,U);
		ctx.lineTo(R,D);
		ctx.lineTo(L,D);
		
		ctx.lineWidth = size;
		ctx.closePath();
		ctx.stroke();
	};

	/* UI GRAPHICS*/

	countDown = (i) => {
		let ctx = this.infoCtx;
		ctx.font = "100px Kongtext";
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		switch (i) {
			case 1:
				ctx.fillStyle = COLOR_MAP[1];
				break;
			case 2:
				ctx.fillStyle = COLOR_MAP[6];
				break;
			case 3:
				ctx.fillStyle = COLOR_MAP[0];
				break;
		}
		ctx.clearRect(BOARD_CENTER_X + this.offset - 100, BOARD_CENTER_Y - 100, 300, 200);
		if (i == 0) return;
		ctx.fillText(i, BOARD_CENTER_X + this.offset, BOARD_CENTER_Y, BLOCK_SIZE_OUTLINE * 10);
	};

	displayScore = (score) => {
		let ctx = this.infoCtx;
		ctx.clearRect(X_OFFSET + this.offset - 5, BOARD_END_Y - 5, BLOCK_SIZE_OUTLINE * 20 + 5, 35);
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = "24px Kongtext";
		ctx.strokeStyle = COLOR_GREY;
		ctx.lineWidth = 5;
		ctx.fillStyle = COLOR_WHITE;

		ctx.strokeText(score, BOARD_CENTER_X + this.offset, BOARD_END_Y + 12);
		ctx.fillText(score, BOARD_CENTER_X + this.offset, BOARD_END_Y + 12);
		
		if(!this.preview) {
			socket.emit('graphics',{
				name:'displayScore',
				args:score
			})
		}
	};

	displayScoreArr = (scoreArr) => {
		if (scoreArr.length == 0) return;
		let ctx = this.infoCtx;

		clearTimeout(this.clearLineInfo);
		ctx.clearRect(0, BOARD_END_Y + 25 + this.offset, BLOCK_SIZE_OUTLINE * 40 + 5, 100);

		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = "15px Kongtext";
		ctx.strokeStyle = COLOR_GREY;
		ctx.lineWidth = 4;
		ctx.fillStyle = COLOR_WHITE;

		for (var i = 0; i < scoreArr.length; i++) {
			let text = `${scoreArr[i][0]}  +${scoreArr[i][1]}`;
			ctx.strokeText(text, BOARD_CENTER_X + this.offset, BOARD_END_Y + 12 + 35 * (i + 1));
			ctx.fillText(text, BOARD_CENTER_X + this.offset, BOARD_END_Y + 12 + 35 * (i + 1));
		}
		this.clearLineInfo = setTimeout(
			() =>
				ctx.clearRect(0 + this.offset, BOARD_END_Y + 25, BLOCK_SIZE_OUTLINE * 40 + 5, 100),
			750
		);
		
		if(!this.preview) {
			socket.emit('graphics',{
				name:'displayScoreArr',
				args:[scoreArr]	
			})
		}
	};

	showGarbage = (n) => {
		const ctx = this.aniCtx;
		ctx.clearRect(X_OFFSET + this.offset, 0 ,X_OFFSET + BLOCK_SIZE_OUTLINE * BOARD_WIDTH, Y_OFFSET);
		
		let arr = [];
		let index = 0;
		let remaining = n;
		
		for(let value in NUISANCE_QUEUE.VALUE) {
			let div = NUISANCE_QUEUE.VALUE[value];
			
			while(remaining >= div){
				remaining -= div;
				let x = X_OFFSET + this.offset + index * (BUBBLING_SIZE+3); 
				let y = Y_OFFSET - BUBBLING_SIZE;
				ctx.drawImage(
					SPRITE_IMAGE, //Source
					NUISANCE_QUEUE.SPRITES[value][0] * BUBBLING_SIZE, //sX
					NUISANCE_QUEUE.SPRITES[value][1] * BUBBLING_SIZE, //sY
					BUBBLING_SIZE, //s Width
					BUBBLING_SIZE, //s Height
					x, //dX
					y, //dY
					BUBBLING_SIZE, //dW
					BUBBLING_SIZE //dH
				);
				index++;
			}
		}

		if(!this.preview) {
			socket.emit('graphics',{
				name:'showGarbage',
				args:n
			})
		}
		
	};

	display = (STATE = -1) => {
		let string;		
		let ctx = this.infoCtx;
		
		ctx.font = "64px Kongtext";
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		
		switch(STATE) {
			case GAME_STATE.WIN:
				string = "WIN";
				ctx.fillStyle = COLOR_MAP[6];
				break;
			case GAME_STATE.LOST:
				string = "LOSE";
				ctx.fillStyle = COLOR_MAP[1];
				break;
			case GAME_STATE.READY:
				string = "READY";
				ctx.fillStyle = COLOR_MAP[0];
				break;
			case GAME_STATE.PLAY_AGAIN:
				string = "PLAY AGAIN";
				ctx.fillStyle = COLOR_WHITE;
				ctx.font = "24px Kongtext";
				break;
			case GAME_STATE.DISCONNECTED:
				ctx.font = "24px Kongtext";
				string = "DISCONNECTED";
				ctx.fillStyle = COLOR_MAP[1];
				break;
			default:
				string = "";
				break;
		}
		
		ctx.clearRect(X_OFFSET+this.offset,Y_OFFSET,BLOCK_SIZE_OUTLINE*10,BLOCK_SIZE_OUTLINE*17)
		ctx.fillText(string, BOARD_CENTER_X + this.offset, BOARD_CENTER_Y, BLOCK_SIZE_OUTLINE * 10);
		ctx.strokeStyle = COLOR_BLACK;
		ctx.lineWidth = 1;
		ctx.strokeText(string, BOARD_CENTER_X + this.offset, BOARD_CENTER_Y, BLOCK_SIZE_OUTLINE * 10);
	}
}