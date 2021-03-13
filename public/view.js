import {ctx0, ctx1, ctx2, ctx3} from "./constants.js";
import {socket} from "./main.js"

import {PLAYER_OFFSET, HOLD, HOLD_X_OFFSET, HOLD_Y_OFFSET, NEXT, NEXT_X_OFFSET, NEXT_Y_OFFSET, NEXT_BLOCK_SIZE_OUTLINE, COLOR_WHITE, HOLD_BLOCK_SIZE_OUTLINE, X_OFFSET, Y_OFFSET, BOARD_WIDTH, BLOCK_SIZE_OUTLINE, COLOR_BLACK, COLOR_MAP,VISIBLE_HEIGHT,P2_COLORS,P1_COLORS,DIST_BTW_NEXTS,BOARD_END_Y,COLOR_GREY,BOARD_CENTER_X,BOARD_CENTER_Y} from './constants.js';

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
		ctx.beginPath();
		ctx.arc(L, U, rad, Math.PI, (Math.PI * 3) / 2, false);
		ctx.lineTo(R, U - rad);
		ctx.arc(R, U, rad, (Math.PI * 3) / 2, 0, false);
		ctx.lineTo(R + rad, D);
		ctx.arc(R, D, rad, 0, Math.PI / 2, false);
		ctx.lineTo(L, D + rad);
		ctx.arc(L, D, rad, Math.PI / 2, Math.PI, false);
		ctx.lineTo(L - rad, U);
		ctx.lineWidth = size;
		ctx.stroke();
	};

	/* UI GRAPHICS*/

	countDown = (i) => {
		let ctx = this.infoCtx;
		ctx.font = "100px 'Press Start 2P'";
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
		ctx.clearRect(BOARD_CENTER_X + this.offset - 100, BOARD_CENTER_Y - 100, 300, 300);
		if (i == 0) return;
		ctx.fillText(i, BOARD_CENTER_X + this.offset, BOARD_CENTER_Y, BLOCK_SIZE_OUTLINE * 10);
	};

	displayScore = (score) => {
		let ctx = this.infoCtx;
		ctx.clearRect(X_OFFSET + this.offset - 5, BOARD_END_Y - 5, BLOCK_SIZE_OUTLINE * 20 + 5, 35);
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = "24px 'Press Start 2P'";
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
		ctx.font = "15px 'Press Start 2P'";
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
		const g10s = parseInt(n / 10);
		const g5s = parseInt((n % 10) / 5);
		const g1s = n % 5;
		const length = g10s + g5s + g1s;
		let accSize = 0;

		ctx.clearRect(
			X_OFFSET + this.offset,
			0,
			X_OFFSET + BLOCK_SIZE_OUTLINE * BOARD_WIDTH,
			Y_OFFSET
		);

		for (let index = 0; index < length; index++) {
			let size = 0;
			if (index < g10s) {
				size = 20;
				ctx.fillStyle = COLOR_MAP[7];
			} else if (index < g10s + g5s) {
				size = 16;
				ctx.fillStyle = COLOR_WHITE;
			} else {
				size = 10;
				ctx.fillStyle = COLOR_WHITE;
			}

			const x = X_OFFSET + this.offset + accSize;
			const y = Y_OFFSET - size - (30 - size) / 2;
			ctx.strokeStyle = COLOR_BLACK;
			ctx.fillRect(x, y, size, size);
			ctx.strokeRect(x, y, size, size);

			accSize += size + 5;
		}
				
		if(!this.preview) {
			socket.emit('graphics',{
				name:'showGarbage',
				args:n
			})
		}
	};
}