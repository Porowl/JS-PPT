import {
	BUBBLING_BOARD_HEIGHT,
	BUBBLING_BOARD_WIDTH,
	BUBBLING_TYPE,
	XY_OFFSETS,
	KICK,
	BUBBLING_STATE,
	DX_DY,
} from '../constants.js';
import Bubbling from './Bubbling.js';

export default class Board {
	constructor() {
		this.table = this.initTable();
		this.inqueue = 0;
		this.garbage = 0;
	}

	initTable = () => {
		const temp = [];
		for (let y = 0; y < BUBBLING_BOARD_HEIGHT; y++) {
			temp.push([]);
			for (let x = 0; x < BUBBLING_BOARD_WIDTH; x++) {
				temp[y].push(BUBBLING_TYPE.EMPTY);
			}
		}
		let e = BUBBLING_TYPE.EMPTY;
		temp[-1] = [e,e,e,e,e,e];
		temp[-2] = [e,e,e,e,e,e];
		return temp;
	};

	valid = (data, color = BUBBLING_TYPE.EMPTY) => {
		let x = data.x; 
		let y = data.y;
		if(!this.validCell(x,y,color)) return false;
		x += data.dx;
		y += data.dy;
		if(!this.validCell(x,y,color)) return false;
		return true;
	};

	validCell = (x, y, color = BUBBLING_TYPE.EMPTY) => {
		if (x < 0 || x > BUBBLING_BOARD_WIDTH || y >= BUBBLING_BOARD_HEIGHT) return false;
		if (this.table[y][x] != color) return false;
		return true
	}

	validRotation = (data, direction = direction.CW) => {
		let rotation = data.rotation + data.tempRotation;
		rotation = (rotation + 4 + direction) % 4;

		let check = {
			...data,
			dx: XY_OFFSETS[rotation][0],
			dy: XY_OFFSETS[rotation][1],
			rotation: rotation,
		};

		if (this.valid(check))
			return data.tempRotation == 1 ? KICK.DOUBLE_ROTATION : KICK.DONT_PUSH;

		let opp = (rotation + 2) % 4;

		if (opp === 2) return KICK.NO_ROTATION;

		check.x += XY_OFFSETS[opp][0];
		check.y += XY_OFFSETS[opp][1];

		if (this.valid(check)) {
			switch (rotation) {
				case 1:
					return KICK.PUSH_LEFT;
				case 2:
					return KICK.PUSH_UP;
				case 3:
					return KICK.PUSH_RIGHT;
			}
		} else return KICK.NO_ROTATION;
	};

	lockMult = (multBubbling) => {
		this.lockSingle(multBubbling.mainPiece);
		this.lockSingle(multBubbling.subPiece);
	};

	lockSingle = (bubbling) => {
		if(bubbling.y>=0&&bubbling.y<BUBBLING_BOARD_HEIGHT && bubbling.x>=0 && bubbling.x<BUBBLING_BOARD_WIDTH){
			this.table[bubbling.y][bubbling.x] = bubbling.type;		
		}
	};

	calc = () => {
		let arr = [];
		let visited = [[]];
		let colors = [];
		let groups = [];
		let numTrash = 0;

		for (let i = 1; i < BUBBLING_BOARD_HEIGHT; i++) {
			visited.push([]);
			for (let j = 0; j < BUBBLING_BOARD_WIDTH; j++) {
				visited[i].push(false);
			}
		}

		for (let i = 1; i < BUBBLING_BOARD_HEIGHT; i++) {
			for (let j = 0; j < BUBBLING_BOARD_WIDTH; j++) {
				if (!visited[i][j] && this.table[i][j] != BUBBLING_TYPE.EMPTY && this.table[i][j] != BUBBLING_TYPE.TRASH) {
					let temp = this.bfs(j, i, visited);
					if (temp.length >= 4) {
						groups.push(temp.length);
						let color = this.table[temp[0]['y']][temp[0]['x']];
						if (!colors.includes(color)) {
							colors.push(color);
						}
						arr = arr.concat(temp);
					}
				}
			}
		}

		let trash = [];
		visited = [[]];
		for (let i = 1; i < BUBBLING_BOARD_HEIGHT; i++) {
			visited.push([]);
			for (let j = 0; j < BUBBLING_BOARD_WIDTH; j++) {
				visited[i].push(false);
			}
		}
		for (let point of arr){
			for (let i = 0; i < 4; i++) {
				let nx = point.x + DX_DY[i][0];
				let ny = point.y + DX_DY[i][1];
				if (nx >= 0 && nx < BUBBLING_BOARD_WIDTH && ny < BUBBLING_BOARD_HEIGHT && ny >= 0 && !visited[ny][nx]) {
					if (this.table[ny][nx] == BUBBLING_TYPE.TRASH) {
						trash.push({x:nx,y:ny,color:BUBBLING_TYPE.TRASH})
					}
					visited[ny][nx] == true;
				}
			}
		}
		
		arr = arr.concat(trash);
		numTrash = trash.length;
		
		return {
			arr,
			groups,
			numTrash,
			colors: colors.length,
		};
	};

	bfs = (x, y, visited) => {
		let queue = [];
		let route = [];

		const color = this.table[y][x];

		queue.push({ x, y });
		route.push({ x, y, color });

		visited[y][x] = true;

		while (queue.length != 0) {
			let point = queue.pop();
			for (let i = 0; i < 4; i++) {
				let ty = point.y + XY_OFFSETS[i][1];
				let tx = point.x + XY_OFFSETS[i][0];
				if (
					ty < 1 || ty >= BUBBLING_BOARD_HEIGHT || tx < 0 || tx >= BUBBLING_BOARD_WIDTH ||
					visited[ty][tx]
				) {
					continue;
				}
				if (this.table[ty][tx] == color) {
					queue.push({ x: tx, y: ty });
					route.push({ x: tx, y: ty, color });
					visited[ty][tx] = true;
				}
			}
		}
		return route;
	};

	pop = (arr) => {
		for (let bubbling of arr) {
			this.table[bubbling.y][bubbling.x] = BUBBLING_TYPE.EMPTY;
		}
	};

	fall = () => {
		let bubblings = [];
		for (let x = 0; x < BUBBLING_BOARD_WIDTH; x++) {
			let xArr = [];
			let lowest = 0;
			for (let y = BUBBLING_BOARD_HEIGHT - 1; y >= 0; y--) {
				if (this.table[y][x] == BUBBLING_TYPE.EMPTY) {
					lowest = y;
					break;
				}
			}

			for (let y = BUBBLING_BOARD_HEIGHT - 2; y >= 0; y--) {
				if (this.table[y][x] != BUBBLING_TYPE.EMPTY) {
					if (this.table[y + 1][x] == BUBBLING_TYPE.EMPTY) {
						let color = this.table[y][x];
						this.table[y][x] = BUBBLING_TYPE.EMPTY;

						let bubbling = new Bubbling(color);

						bubbling.setPos(x, y);
						bubbling.setLimit(lowest--);
						xArr.push(bubbling);
					}
				}
			}
			bubblings.push(xArr);
		}
		return bubblings;
	};

	addGarbage = n => {
		this.inqueue += n;
	};

	deductGarbage = n => {
		let d = this.garbage - n;
			if(d>0) {
				n = 0;
				this.garbage = d;
			} else {
				n = 0 - d;
				this.garbage = 0;
			}
		if(n > 0) {
			let d = this.inqueue - n;
			if(d>0) {
				n = 0;
				this.inqueue = d;
			} else {
				n = 0 - d;
				this.inqueue = 0;
			}
		}
		return n;
	};

	queueGarbage = () => {
		this.garbage += this.inqueue;
		this.inqueue = 0;
	}

	executeGarbage = () => {
		let attack = Math.min(this.garbage,30);
		this.garbage -= attack;
		
		let lines = ( attack / 6 ) | 0;
		let remaining = attack % 6;
		
		let arr = [0,0,0,0,0,0];
		
		for(var i = 0; i<remaining;i++) {
			let temp = 0;
			do {
				temp = Math.random()*6|0
			} while (arr[temp] == 1)
			arr[temp] = 1;
		}
		let garb = [];
		
		for(var i = 0; i<BUBBLING_BOARD_WIDTH; i++) {
			arr[i] += lines;
			
			let counter = -1;
			let temp = [];
			
			let lowest = 0;
			for (let y = BUBBLING_BOARD_HEIGHT - 1; y >= 0; y--) {
				if (this.table[y][i] == BUBBLING_TYPE.EMPTY) {
					lowest = y;
					break;
				}
			}
			for(var j = 0; j<arr[i];j++) {
				let garbBubbling = new Bubbling(BUBBLING_TYPE.TRASH)
				garbBubbling.setPos(i, counter--);
				garbBubbling.setLimit(lowest--);
				temp.push(garbBubbling);
			}
			garb.push(temp);
		}
		
		return garb;
	};

	getTotalGarb = () => {
		return this.garbage + this.inqueue;
	}

	blocked = () => {
		return this.table[1][2] != BUBBLING_TYPE.EMPTY;
	}
}
