import {BOARD_HEIGHT, BOARD_WIDTH, LAST_MOVE,T_SPIN_STATE,PIECE_MAP} from '../constants.js'

export default class Stage {
	constructor() {
		this.field = [];

		for (var i = 0; i < BOARD_HEIGHT; i++) {
			this.field.push([]);
			for (var j = 0; j < BOARD_WIDTH; j++) {
				this.field[i].push(-1);
			}
		}

		this.remaining = 0;
		this.garbage = 0;
		this.gauge = 0;
	}

	
	isEmpty = () => this.remaining == 0;

	lock = (p) => {
		let shape = PIECE_MAP[p.typeId][p.rotation];

		let lowest = 0;
		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 4; j++) {
				if (shape & (0x8000 >> (i * 4 + j))) {
					var tx = p.x + j;
					var ty = p.y + i;
					if(ty>lowest) lowest = ty; 
					this.field[ty][tx] = p.typeId;
				}
			}
		}
		
		let data = new lockData();
		if(lowest<20) data.topOut = true;

		for (var i = p.y; i < Math.min(p.y + 4, BOARD_HEIGHT); i++) {
			if (this.checkLine(i)) {
				data.add(i);
			}
		}

		if (p.typeId === 2 && p.lastMove === LAST_MOVE.SPIN) {
			data.tSpin = this.checkTSpin(p.x, p.y, p.rotation, p.rotTest);
		}

		this.remaining += 4;
		
		return data;
	};

	checkLine = (y) => {
		let filled = true;
		for (var x = 0; x < BOARD_WIDTH; x++) {
			if (this.field[y][x] === -1) {
				filled = false;
				break;
			}
		}
		return filled;
	};

	clearLine = (i) => {
		for (var y = i; y > 0; y--) {
			for (var x = 0; x < BOARD_WIDTH; x++) {
				this.field[y][x] = this.field[y - 1][x];
			}
		}
		this.remaining -= 10;
	};

	canMove = (p, x, y) => {
		let shape = PIECE_MAP[p.typeId][p.rotation];

		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 4; j++) {
				if (shape & (0x8000 >> (i * 4 + j))) {
					var tx = p.x + j + x;
					var ty = p.y + i + y;
					if (!this.isEmptyCell(tx, ty)) return false;
				}
			}
		}
		return true;
	};
	isEmptyCell = (x, y) => 
	{
		if(x<0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return false;
		return this.field[y][x] === -1;
	}

	getGhostIndex = (piece) => {
		var temp = 0;
		while (this.canMove(piece, 0, temp+1))
		{
			temp++;
		}
		return temp;
	};

	checkTSpin = (x, y, r, l) => {
		let corners = 0b0000;
		let tSpinCounter = 0;
		let tSpinMini = false;
		if (!this.isEmptyCell(x, y)) {
			//LU
			corners = corners & 0b1000;
			tSpinCounter++;
		}
		if (!this.isEmptyCell(x + 2, y)) {
			//RU
			corners = corners & 0b0100;
			tSpinCounter++;
		}
		if (!this.isEmptyCell(x, y + 2)) {
			//LD
			corners = corners & 0b0010;
			tSpinCounter++;
		}
		if (!this.isEmptyCell(x + 2, y + 2)) {
			//RD
			corners = corners & 0b0001;
			tSpinCounter++;
		}

		if (tSpinCounter > 2) {
			switch (r) {
				case 0:
					tSpinMini = !(corners & 0b1100);
					break;
				case 1:
					tSpinMini = !(corners & 0b0101);
					break;
				case 2:
					tSpinMini = !(corners & 0b0011);
					break;
				case 3:
					tSpinMini = !(corners & 0b1010);
					break;
			}
		} else return T_SPIN_STATE.NONE;

		if (tSpinMini && l < 4) return T_SPIN_STATE.MINI;
		return T_SPIN_STATE.PROP;
	};

	hardDrop = (piece) => {
		let counter = 0;
		while (this.canMove(piece, 0, 1)) {
			piece.move(0, 1);
			counter++;
		}
		if(counter!=0) piece.lastMove = LAST_MOVE.MOVE;

		return counter;
	};

	executeGarbage = (vsBubbling) => {
		if(this.garbage>=40) return false;
		let n = Math.min(this.garbage, BOARD_HEIGHT - 1);
		
		if(vsBubbling && n > 7) n = 7;
		
		for (let y = 0; y < BOARD_HEIGHT - n; y++) {
			for (let x = 0; x < BOARD_WIDTH; x++) this.field[y][x] = this.field[y + n][x];
		}
		let empty = parseInt(Math.random() * BOARD_WIDTH);
		for (let y = BOARD_HEIGHT - n; y < BOARD_HEIGHT; y++) {
			let chance = parseInt(Math.random() * 10);
			if (chance < 3) empty = parseInt(Math.random() * BOARD_WIDTH);
			for (let x = 0; x < BOARD_WIDTH; x++) this.field[y][x] = x == empty ? -1 : 7;
		}
		this.remaining += this.garbage*9;
		
		this.garbage -= n;

		return true;
	};

	addGarbage = (n) => {
		let temp = n;
		if(this.gauge>0){
			if(this.gauge > temp){
				this.gauge -= temp;
			} else {
				temp -= his.gauge;
				this.gauge = 0;
				this.garbage += temp;
			}
		} else { 
			this.garbage += n;		
		}
	};

	deductGarbage = (n) => {
		this.garbage -= n;
		if (this.garbage < 0) {
			let a = 0 - this.garbage;
			this.garbage = 0;
			return a;
		}
		return 0;
	};

	addGauge = (n, m) => {
		if(this.garbage > 0) {
			this.garbage -= n;
			if(this.garbage<0) {
				let a = 0 - this.garbage;
				this.garbage = 0;
				this.gauge += a;
			}
		} else {
			this.gauge += m;
		}
		if(this.gauge>60) this.gauge = 60;
	}
	
	resetGauge = () => {
		let temp = this.gauge;
		this.gauge = 0;
		return temp;
	}
}

class lockData {
	constructor() {
		this.lines = [];
		this.tSpin = T_SPIN_STATE.NONE;
		this.topOut = false;
	}

	add = (i) => this.lines.push(i);
	get = (i) => this.lines[i];
	length = () => this.lines.length;
}