import {
	PUYO_BOARD_HEIGHT,
	PUYO_BOARD_WIDTH,
	PUYO_TYPE,
	XY_OFFSETS,
	KICK,
	PUYO_STATE,
	DX_DY,
} from '../constants.js';
import Puyo from './Puyo.js';

export default class Board {
	constructor() {
		this.table = this.initTable();
		this.garbage = 0;
	}

	initTable = () => {
		const temp = [];
		for (let y = 0; y < PUYO_BOARD_HEIGHT; y++) {
			temp.push([]);
			for (let x = 0; x < PUYO_BOARD_WIDTH; x++) {
				temp[y].push(PUYO_TYPE.EMPTY);
			}
		}
		temp[-1] = [PUYO_TYPE.EMPTY,PUYO_TYPE.EMPTY,PUYO_TYPE.EMPTY,PUYO_TYPE.EMPTY,PUYO_TYPE.EMPTY,PUYO_TYPE.EMPTY];
		temp[-2] = [PUYO_TYPE.EMPTY,PUYO_TYPE.EMPTY,PUYO_TYPE.EMPTY,PUYO_TYPE.EMPTY,PUYO_TYPE.EMPTY,PUYO_TYPE.EMPTY];
		return temp;
	};

	valid = (data, color = PUYO_TYPE.EMPTY) => {
		let x = data.x;
		let y = data.y;

		if (x < 0 || x > PUYO_BOARD_WIDTH || y >= PUYO_BOARD_HEIGHT) return false;
		if (this.table[y][x] != color) return false;

		x += data.dx;
		y += data.dy;

		if (x < 0 || x > PUYO_BOARD_WIDTH || y >= PUYO_BOARD_HEIGHT) return false;
		if (this.table[y][x] != color) return false;

		return true;
	};

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

	lockMult = (multPuyo) => {
		this.lockSingle(multPuyo.mainPiece);
		this.lockSingle(multPuyo.subPiece);
	};

	lockSingle = (puyo) => {
		//console.log(`locking ${puyo.type} at (${puyo.x},${puyo.y})`)
		if(puyo.y>=0&&puyo.y<PUYO_BOARD_HEIGHT && puyo.x>=0 && puyo.x<PUYO_BOARD_WIDTH){
			this.table[puyo.y][puyo.x] = puyo.type;		
		}
	};

	calc = () => {
		let arr = [];
		let visited = [[]];
		let colors = [];
		let groups = [];
		let numTrash = 0;

		for (let i = 1; i < PUYO_BOARD_HEIGHT; i++) {
			visited.push([]);
			for (let j = 0; j < PUYO_BOARD_WIDTH; j++) {
				visited[i].push(false);
			}
		}

		for (let i = 1; i < PUYO_BOARD_HEIGHT; i++) {
			for (let j = 0; j < PUYO_BOARD_WIDTH; j++) {
				if (!visited[i][j] && this.table[i][j] != PUYO_TYPE.EMPTY && this.table[i][j] != PUYO_TYPE.TRASH) {
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
		for (let i = 1; i < PUYO_BOARD_HEIGHT; i++) {
			visited.push([]);
			for (let j = 0; j < PUYO_BOARD_WIDTH; j++) {
				visited[i].push(false);
			}
		}
		for (let point of arr){
			for (let i = 0; i < 4; i++) {
				let nx = point.x + DX_DY[i][0];
				let ny = point.y + DX_DY[i][1];
				if (nx >= 0 && nx < PUYO_BOARD_WIDTH && ny < PUYO_BOARD_HEIGHT && ny >= 0 && !visited[ny][nx]) {
					if (this.table[ny][nx] == PUYO_TYPE.TRASH) {
						trash.push({x:nx,y:ny,color:PUYO_TYPE.TRASH})
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
					ty < 1 || ty >= PUYO_BOARD_HEIGHT || tx < 0 || tx >= PUYO_BOARD_WIDTH ||
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
		for (let puyo of arr) {
			this.table[puyo.y][puyo.x] = PUYO_TYPE.EMPTY;
		}
	};

	fall = () => {
		let puyos = [];
		for (let x = 0; x < PUYO_BOARD_WIDTH; x++) {
			let xArr = [];
			let lowest = 0;
			for (let y = PUYO_BOARD_HEIGHT - 1; y >= 0; y--) {
				if (this.table[y][x] == PUYO_TYPE.EMPTY) {
					lowest = y;
					break;
				}
			}

			for (let y = PUYO_BOARD_HEIGHT - 2; y > 0; y--) {
				if (this.table[y][x] != PUYO_TYPE.EMPTY) {
					if (this.table[y + 1][x] == PUYO_TYPE.EMPTY) {
						let color = this.table[y][x];
						this.table[y][x] = PUYO_TYPE.EMPTY;

						let puyo = new Puyo(color);

						puyo.setPos(x, y);
						//console.log(`new dropping puyo type ${color} at (${x},${y}) to (${x},${lowest})`)
						puyo.setLimit(lowest--);
						xArr.push(puyo);
					}
				}
			}
			puyos.push(xArr);
		}
		return puyos;
	};

	addGarbage = n => {
		this.garbage += n;
	};

	deductGarbage = n => {
		this.garbage -= n;
		if (this.garbage < 0) {
			let a = 0 - this.garbage;
			this.garbage = 0;
			return a;
		} else return 0;
	};

	executeGarbage = () => {
		let attack = Math.min(this.garbage,30);
		console.log('executing', attack)
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
		
		for(var i = 0; i<PUYO_BOARD_WIDTH; i++) {
			arr[i] += lines;
			
			let counter = -1;
			let temp = [];
			
			let lowest = 0;
			for (let y = PUYO_BOARD_HEIGHT - 1; y >= 0; y--) {
				if (this.table[y][i] == PUYO_TYPE.EMPTY) {
					lowest = y;
					break;
				}
			}
			for(var j = 0; j<arr[i];j++) {
				let garbPuyo = new Puyo(PUYO_TYPE.TRASH)
				garbPuyo.setPos(i, counter--);
				garbPuyo.setLimit(lowest--);
				temp.push(garbPuyo);
			}
			garb.push(temp);
		}
		
		return garb;
	};

	blocked = () => {
		return this.table[1][2] != PUYO_TYPE.EMPTY;
	}
}